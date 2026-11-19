import { createHttpMockingServer } from "@hyper-fetch/testing";
import { waitFor } from "@testing-library/dom";
import { getErrorMessage } from "adapter";
import { Client } from "client";
import type { RequestResponseEventType } from "managers";
import type { OptimisticRollbackArgs, RequestInstance } from "request";
import { scopeKey } from "request";

import { getThrownErrors } from "../../utils/fixtures.utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

const SERVER_ITEM = "server";
const OPTIMISTIC_ITEM = "optimistic";
const INITIAL_LIST = [SERVER_ITEM];
const OPTIMISTIC_LIST = [SERVER_ITEM, OPTIMISTIC_ITEM];

/**
 * Builds isolated client with a seeded list and a mutation which adds one item to it optimistically
 */
const createSetup = () => {
  const client = new Client({ url: "shared-base-url" });
  const list = client.createRequest<{ response: string[] }>()({ endpoint: "/list" });

  client.cache.set(list, {
    data: INITIAL_LIST,
    error: null,
    status: 200,
    success: true,
    extra: client.adapter.defaultExtra,
    retries: 0,
    isCanceled: false,
    isOffline: false,
    willRetry: false,
    addedTimestamp: Date.now(),
    triggerTimestamp: Date.now(),
    requestTimestamp: Date.now(),
    // Garbage collector drops the entries with outdated timestamps
    responseTimestamp: Date.now(),
  });

  const readList = () => client.cache.get<string[], unknown>(list.cacheKey)?.data;
  const addItem = (item: string) => {
    client.cache.update(list, (prev) => ({ data: [...(prev?.data ?? []), item] }));
  };
  const removeItem = (item: string) => {
    client.cache.update(list, (prev) => ({ data: (prev?.data ?? []).filter((value) => value !== item) }));
  };

  const rollback = vi.fn((_args: OptimisticRollbackArgs<any>) => {
    removeItem(OPTIMISTIC_ITEM);
  });
  const invalidate = vi.spyOn(client.cache, "invalidate");
  const logError = vi.spyOn(client.logger, "error");

  const mutation = client
    .createRequest<{ response: { ok: boolean } }>()({ endpoint: "/mutation", method: "POST" })
    .setOptimistic(() => {
      addItem(OPTIMISTIC_ITEM);
      return { context: { item: OPTIMISTIC_ITEM }, rollback, invalidate: [list] };
    });

  const responses: RequestResponseEventType<RequestInstance>[] = [];
  client.requestManager.events.onResponse((values) => {
    responses.push(values);
  });

  const dispatcher = client.submitDispatcher;
  const queryKey = scopeKey(mutation.queryKey, mutation.scope);
  const abortKey = scopeKey(mutation.abortKey, mutation.scope);

  return {
    client,
    list,
    mutation,
    rollback,
    invalidate,
    logError,
    responses,
    dispatcher,
    queryKey,
    abortKey,
    readList,
    addItem,
    removeItem,
  };
};

type Setup = ReturnType<typeof createSetup>;
type Mutation = Setup["mutation"];

type Scenario = {
  name: string;
  build?: (setup: Setup) => Mutation;
  /** Arrange the mocks and return options for the send call */
  arrange: (setup: Setup, request: Mutation) => Record<string, unknown> | void;
  /** Drive the request while it is pending */
  drive?: (setup: Setup, request: Mutation) => Promise<void>;
  /** Wait for the work trailing after the promise got resolved */
  settled?: (setup: Setup) => Promise<void>;
  expected: {
    list: string[];
    invalidated: boolean;
    success: boolean;
    rollback?: {
      reason: "error" | "abort" | "removed";
      status?: number;
      errorMessage?: string;
    };
    resultError?: string;
  };
};

const waitForResponses = async (setup: Setup, count: number) => {
  await waitFor(() => {
    expect(setup.responses).toHaveLength(count);
  });
};

const goOfflineOnFirstAttempt = (setup: Setup) => {
  let isFirstAttempt = true;
  return {
    onRequestStart: () => {
      if (isFirstAttempt) {
        isFirstAttempt = false;
        setup.client.appManager.setOnline(false);
      }
    },
  };
};

const scenarios: Scenario[] = [
  {
    name: "success",
    arrange: (_, request) => {
      mockRequest(request, { data: { ok: true } });
    },
    expected: { list: OPTIMISTIC_LIST, invalidated: true, success: true },
  },
  {
    name: "final error",
    arrange: (_, request) => {
      mockRequest(request, { status: 400 });
    },
    expected: {
      list: INITIAL_LIST,
      invalidated: false,
      success: false,
      rollback: { reason: "error", status: 400 },
    },
  },
  {
    name: "abort",
    arrange: (_, request) => {
      mockRequest(request, { delay: 100 });
      return {
        onRequestStart: () => {
          request.abort();
        },
      };
    },
    expected: {
      list: INITIAL_LIST,
      invalidated: false,
      success: false,
      rollback: { reason: "abort", errorMessage: getErrorMessage("abort").message },
      resultError: getErrorMessage("abort").message,
    },
  },
  {
    name: "removal of a queued request",
    arrange: (setup, request) => {
      mockRequest(request);
      setup.dispatcher.stop(setup.queryKey);
      return {
        onBeforeSent: ({ requestId }: { requestId: string }) => {
          // Listeners of the send call are attached right after this callback
          queueMicrotask(() => {
            setup.dispatcher.delete(setup.queryKey, requestId, setup.abortKey);
          });
        },
      };
    },
    expected: {
      list: INITIAL_LIST,
      invalidated: false,
      success: false,
      rollback: { reason: "removed" },
      resultError: getErrorMessage("deleted").message,
    },
  },
  {
    name: "removal of a running request",
    arrange: (setup, request) => {
      mockRequest(request, { delay: 100 });
      return {
        onRequestStart: ({ requestId }: { requestId: string }) => {
          setup.dispatcher.delete(setup.queryKey, requestId, setup.abortKey);
        },
      };
    },
    // The aborted adapter responds after the promise was already resolved
    settled: (setup) => waitForResponses(setup, 1),
    expected: {
      list: INITIAL_LIST,
      invalidated: false,
      success: false,
      rollback: { reason: "removed" },
      resultError: getErrorMessage("deleted").message,
    },
  },
  {
    name: "retry then success",
    build: ({ mutation }) => mutation.setRetry(1).setRetryTime(10),
    arrange: (setup, request) => {
      mockRequest(request, { status: 400 });
      const unmount = setup.client.requestManager.events.onResponse(() => {
        unmount();
        mockRequest(request, { data: { ok: true } });
      });
    },
    expected: { list: OPTIMISTIC_LIST, invalidated: true, success: true },
  },
  {
    name: "retry then error",
    build: ({ mutation }) => mutation.setRetry(1).setRetryTime(10),
    arrange: (setup, request) => {
      mockRequest(request, { status: 400 });
      const unmount = setup.client.requestManager.events.onResponse(() => {
        unmount();
        mockRequest(request, { status: 500 });
      });
    },
    expected: {
      list: INITIAL_LIST,
      invalidated: false,
      success: false,
      rollback: { reason: "error", status: 500 },
    },
  },
  {
    name: "offline then success",
    arrange: (setup, request) => {
      mockRequest(request, { status: 400, delay: 30 });
      return goOfflineOnFirstAttempt(setup);
    },
    drive: async (setup, request) => {
      await waitForResponses(setup, 1);
      expect(setup.rollback).not.toHaveBeenCalled();
      expect(setup.readList()).toStrictEqual(OPTIMISTIC_LIST);
      mockRequest(request, { data: { ok: true } });
      setup.client.appManager.setOnline(true);
    },
    expected: { list: OPTIMISTIC_LIST, invalidated: true, success: true },
  },
  {
    name: "offline then error",
    arrange: (setup, request) => {
      mockRequest(request, { status: 400, delay: 30 });
      return goOfflineOnFirstAttempt(setup);
    },
    drive: async (setup, request) => {
      await waitForResponses(setup, 1);
      expect(setup.rollback).not.toHaveBeenCalled();
      expect(setup.readList()).toStrictEqual(OPTIMISTIC_LIST);
      mockRequest(request, { status: 500 });
      setup.client.appManager.setOnline(true);
    },
    expected: {
      list: INITIAL_LIST,
      invalidated: false,
      success: false,
      rollback: { reason: "error", status: 500 },
    },
  },
];

const entryPoints = [
  {
    name: "send()",
    run: (request: Mutation, options: Record<string, unknown>) => {
      return request.send(options as any).then((result) => ({ result, observed: null }));
    },
  },
  {
    name: "$hooks",
    run: (request: Mutation, options: Record<string, unknown>, setup?: Setup) => {
      let observed: { list?: string[] | null; rollbacks: number; invalidations: number } | null = null;
      const observe = () => {
        observed = {
          list: setup?.readList(),
          rollbacks: setup?.rollback.mock.calls.length ?? 0,
          invalidations: setup?.invalidate.mock.calls.length ?? 0,
        };
      };
      request.$hooks.onResponse(observe);
      request.$hooks.onRemove(observe);
      return request.send(options as any).then((result) => ({ result, observed }));
    },
  },
];

describe("Request [ Optimistic settlement ]", () => {
  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe.each(entryPoints)("when using $name", ({ name: entryPoint, run }) => {
    it.each(scenarios)("should settle $name", async ({ build, arrange, drive, settled, expected }) => {
      const setup = createSetup();
      const request = build?.(setup) ?? setup.mutation;
      let sentRequest: RequestInstance | undefined;

      const options = arrange(setup, request) ?? {};
      const pending = run(
        request,
        {
          ...options,
          onBeforeSent: (data: { request: RequestInstance; requestId: string }) => {
            sentRequest = data.request;
            (options as { onBeforeSent?: (value: typeof data) => void }).onBeforeSent?.(data);
          },
        },
        setup,
      );

      await drive?.(setup, request);
      const { result, observed } = await pending;
      await settled?.(setup);

      expect(setup.readList()).toStrictEqual(expected.list);
      expect(result.success).toBe(expected.success);
      if (expected.resultError) {
        expect((result.error as Error).message).toBe(expected.resultError);
      }

      if (expected.invalidated) {
        expect(setup.invalidate).toHaveBeenCalledTimes(1);
        expect(setup.invalidate).toHaveBeenCalledWith(setup.list);
        expect(setup.client.cache.get(setup.list.cacheKey)?.staleTime).toBe(0);
      } else {
        expect(setup.invalidate).not.toHaveBeenCalled();
      }

      if (expected.rollback) {
        expect(setup.rollback).toHaveBeenCalledTimes(1);
        const [args] = setup.rollback.mock.calls[0];
        expect(args.reason).toBe(expected.rollback.reason);
        expect(args.request).toBe(sentRequest);

        if (expected.rollback.reason === "removed") {
          expect(args.response).toBeUndefined();
          expect(args).not.toHaveProperty("response");
        } else {
          expect(args.response?.success).toBe(false);
        }
        if (expected.rollback.status) {
          expect(args.response?.status).toBe(expected.rollback.status);
        }
        if (expected.rollback.errorMessage) {
          expect(args.response?.error).toHaveProperty("message", expected.rollback.errorMessage);
        }
      } else {
        expect(setup.rollback).not.toHaveBeenCalled();
      }

      // Lifecycle listeners have to see the state that is already settled
      if (entryPoint === "$hooks") {
        expect(observed).toStrictEqual({
          list: expected.list,
          rollbacks: expected.rollback ? 1 : 0,
          invalidations: expected.invalidated ? 1 : 0,
        });
      }
    });
  });

  describe("when the request never gets sent", () => {
    it("should not roll back when optimistic callback throws", async () => {
      const { client } = createSetup();
      const rollback = vi.fn();
      const add = vi.spyOn(client.submitDispatcher, "add");
      const request = client
        .createRequest<{ response: null }>()({ endpoint: "/mutation", method: "POST" })
        .setOptimistic(() => {
          throw new Error("Optimistic failed");
          // eslint-disable-next-line no-unreachable
          return { rollback };
        });

      const result = await request.send();

      expect(result.success).toBe(false);
      expect(add).not.toHaveBeenCalled();
      expect(rollback).not.toHaveBeenCalled();
    });
  });

  describe("when optimistic callback returns partial result", () => {
    it("should resolve failed request without rollback", async () => {
      const { client } = createSetup();
      const request = client
        .createRequest<{ response: null }>()({ endpoint: "/mutation", method: "POST" })
        .setOptimistic(() => ({}));
      mockRequest(request, { status: 400 });

      const result = await request.send();

      expect(result.status).toBe(400);
    });

    it("should resolve successful request without invalidate", async () => {
      const { client, invalidate } = createSetup();
      const request = client
        .createRequest<{ response: null }>()({ endpoint: "/mutation", method: "POST" })
        .setOptimistic(() => ({}));
      mockRequest(request);

      const result = await request.send();

      expect(result.success).toBeTrue();
      expect(invalidate).not.toHaveBeenCalled();
    });

    it("should support rollback declared without arguments", async () => {
      const { client } = createSetup();
      let calls = 0;
      const request = client
        .createRequest<{ response: null }>()({ endpoint: "/mutation", method: "POST" })
        .setOptimistic(() => ({
          rollback: () => {
            calls += 1;
          },
        }));
      mockRequest(request, { status: 400 });

      await request.send();

      expect(calls).toBe(1);
    });

    it("should use rollback returned from async optimistic callback", async () => {
      const { client } = createSetup();
      const rollback = vi.fn();
      const request = client
        .createRequest<{ response: null }>()({ endpoint: "/mutation", method: "POST" })
        .setOptimistic(async () => ({ rollback }));
      mockRequest(request, { status: 400 });

      await request.send();

      expect(rollback).toHaveBeenCalledTimes(1);
      expect(rollback.mock.calls[0][0]).toHaveProperty("reason", "error");
    });
  });

  describe("when settlement callbacks fail", () => {
    it("should resolve normally, log and throw outside of the lifecycle when rollback throws", async () => {
      const { client, logError } = createSetup();
      const failure = new Error("Rollback failed");
      const request = client
        .createRequest<{ response: null }>()({ endpoint: "/mutation", method: "POST" })
        .setOptimistic(() => ({
          rollback: () => {
            throw failure;
          },
        }));
      mockRequest(request, { status: 400 });

      let result: Awaited<ReturnType<typeof request.send>> | undefined;
      const thrown = await getThrownErrors(async () => {
        result = await request.send();
      });

      expect(result?.status).toBe(400);
      expect(thrown).toStrictEqual([failure]);
      expect(logError).toHaveBeenCalledTimes(1);
      expect(logError.mock.calls[0][0].extra).toMatchObject({ error: failure, reason: "error" });
    });

    it("should resolve normally and log when async rollback rejects", async () => {
      const { client, logError } = createSetup();
      const failure = new Error("Async rollback failed");
      const request = client
        .createRequest<{ response: null }>()({ endpoint: "/mutation", method: "POST" })
        .setOptimistic(() => ({
          rollback: async () => {
            throw failure;
          },
        }));
      mockRequest(request, { status: 400 });

      let result: Awaited<ReturnType<typeof request.send>> | undefined;
      const thrown = await getThrownErrors(async () => {
        result = await request.send();
        await waitFor(() => {
          expect(logError).toHaveBeenCalledTimes(1);
        });
      });

      expect(result?.status).toBe(400);
      expect(thrown).toStrictEqual([failure]);
      expect(logError.mock.calls[0][0].extra).toMatchObject({ error: failure, reason: "error" });
    });

    it("should resolve normally and log when rollback throws during queue removal", async () => {
      const { client, logError } = createSetup();
      const request = client
        .createRequest<{ response: null }>()({ endpoint: "/mutation", method: "POST" })
        .setOptimistic(() => ({
          rollback: () => {
            throw new Error("Rollback failed");
          },
        }));
      const queryKey = scopeKey(request.queryKey, request.scope);
      client.submitDispatcher.stop(queryKey);

      let result: Awaited<ReturnType<typeof request.send>> | undefined;
      const thrown = await getThrownErrors(async () => {
        result = await request.send({
          onBeforeSent: ({ requestId }) => {
            queueMicrotask(() => {
              client.submitDispatcher.delete(queryKey, requestId, scopeKey(request.abortKey, request.scope));
            });
          },
        });
      });

      expect((result?.error as Error | undefined)?.message).toBe(getErrorMessage("deleted").message);
      expect(thrown).toStrictEqual([new Error("Rollback failed")]);
      expect(logError).toHaveBeenCalledTimes(1);
    });

    it("should keep invalidating other targets and log when invalidation throws", async () => {
      const { client, invalidate, logError, list } = createSetup();
      const failure = new Error("Invalidate failed");
      const other = client.createRequest<{ response: null }>()({ endpoint: "/other" });
      invalidate.mockImplementationOnce(() => {
        throw failure;
      });
      const request = client
        .createRequest<{ response: null }>()({ endpoint: "/mutation", method: "POST" })
        .setOptimistic(() => ({ invalidate: [list, other] }));
      mockRequest(request);

      let result: Awaited<ReturnType<typeof request.send>> | undefined;
      const thrown = await getThrownErrors(async () => {
        result = await request.send();
      });

      expect(result?.success).toBeTrue();
      expect(thrown).toStrictEqual([failure]);
      expect(invalidate).toHaveBeenCalledTimes(2);
      expect(invalidate).toHaveBeenLastCalledWith(other);
      expect(logError).toHaveBeenCalledTimes(1);
      expect(logError.mock.calls[0][0].extra).toMatchObject({ error: failure, target: list });
    });
  });

  describe("when observing the order of events", () => {
    it("should roll back before response listeners attached in onBeforeSent", async () => {
      const { client, mutation, rollback } = createSetup();
      const order: string[] = [];
      rollback.mockImplementation(() => {
        order.push("rollback");
      });
      mockRequest(mutation, { status: 400 });

      await mutation.send({
        onBeforeSent: ({ requestId }) => {
          client.requestManager.events.onResponseById(requestId, () => {
            order.push("listener");
          });
        },
        onResponse: () => {
          order.push("onResponse");
        },
      });

      expect(order).toStrictEqual(["rollback", "listener", "onResponse"]);
    });

    it("should invalidate before response listeners attached in onBeforeSent", async () => {
      const { client, mutation, invalidate } = createSetup();
      const order: string[] = [];
      invalidate.mockImplementation(() => {
        order.push("invalidate");
      });
      mockRequest(mutation);

      await mutation.send({
        onBeforeSent: ({ requestId }) => {
          client.requestManager.events.onResponseById(requestId, () => {
            order.push("listener");
          });
        },
        onResponse: () => {
          order.push("onResponse");
        },
      });

      expect(order).toStrictEqual(["invalidate", "listener", "onResponse"]);
    });

    it("should roll back before removal callbacks", async () => {
      const { mutation, rollback, dispatcher, queryKey, abortKey } = createSetup();
      const order: string[] = [];
      rollback.mockImplementation(() => {
        order.push("rollback");
      });
      dispatcher.stop(queryKey);

      await mutation.send({
        onBeforeSent: ({ requestId }) => {
          queueMicrotask(() => {
            dispatcher.delete(queryKey, requestId, abortKey);
          });
        },
        onRemove: () => {
          order.push("onRemove");
        },
      });

      expect(order).toStrictEqual(["rollback", "onRemove"]);
    });
  });

  describe("when response is mapped", () => {
    it("should pass the mapped response to rollback", async () => {
      const { mutation, rollback } = createSetup();
      const request = mutation.setResponseMapper((response) => ({ ...response, status: 418 }) as typeof response);
      mockRequest(request, { status: 400 });

      await request.send();

      expect(rollback).toHaveBeenCalledTimes(1);
      expect(rollback.mock.calls[0][0].response?.status).toBe(418);
    });

    it("should run the mapper once per response", async () => {
      const { mutation } = createSetup();
      const mapper = vi.fn((response) => response);
      const request = mutation.setResponseMapper(mapper);
      mockRequest(request, { status: 400 });

      await request.send();

      expect(mapper).toHaveBeenCalledTimes(1);
    });

    it("should run the async mapper once per response", async () => {
      const { mutation } = createSetup();
      const mapper = vi.fn(async (response) => response);
      const request = mutation.setResponseMapper(mapper);
      mockRequest(request, { status: 400 });

      await request.send();

      expect(mapper).toHaveBeenCalledTimes(1);
    });

    it("should roll back when mapper turns success into failure", async () => {
      const { mutation, rollback, invalidate, readList } = createSetup();
      const request = mutation.setResponseMapper(
        (response) => ({ ...response, success: false, status: 422 }) as typeof response,
      );
      mockRequest(request);

      await request.send();

      expect(rollback).toHaveBeenCalledTimes(1);
      expect(rollback.mock.calls[0][0]).toMatchObject({ reason: "error" });
      expect(rollback.mock.calls[0][0].response?.status).toBe(422);
      expect(invalidate).not.toHaveBeenCalled();
      expect(readList()).toStrictEqual(INITIAL_LIST);
    });

    it("should invalidate when mapper turns failure into success", async () => {
      const { mutation, rollback, invalidate, list } = createSetup();
      const request = mutation.setResponseMapper(
        (response) => ({ ...response, success: true, error: null }) as typeof response,
      );
      mockRequest(request, { status: 400 });

      await request.send();

      expect(rollback).not.toHaveBeenCalled();
      expect(invalidate).toHaveBeenCalledTimes(1);
      expect(invalidate).toHaveBeenCalledWith(list);
    });

    it("should report final error once when async mapper outlives queue removal", async () => {
      const { mutation, rollback, dispatcher, queryKey } = createSetup();
      let release: VoidFunction = () => undefined;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      const request = mutation.setResponseMapper(async (response) => {
        await gate;
        return { ...response, status: 418 } as typeof response;
      });
      mockRequest(request, { status: 400 });

      const pending = request.send();
      // The dispatcher drops finished request from the queue before the mapper is done
      await waitFor(() => {
        expect(dispatcher.getQueue(queryKey).requests).toHaveLength(0);
      });
      expect(rollback).not.toHaveBeenCalled();
      release();
      const result = await pending;

      expect(result.status).toBe(418);
      expect(rollback).toHaveBeenCalledTimes(1);
      expect(rollback.mock.calls[0][0]).toMatchObject({ reason: "error" });
      expect(rollback.mock.calls[0][0].response?.status).toBe(418);
    });

    it("should ignore mapped response resolved after the request got removed", async () => {
      const { mutation, rollback, invalidate, dispatcher, queryKey, abortKey, responses } = createSetup();
      // The retry timer is not part of this case
      vi.spyOn(dispatcher, "performRequest");
      let release: VoidFunction = () => undefined;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      const mapper = vi.fn(async (response) => {
        await gate;
        return { ...response, success: true, error: null };
      });
      const request = mutation.setRetry(1).setRetryTime(50).setResponseMapper(mapper);
      mockRequest(request, { status: 400 });
      const onResponse = vi.fn();
      let requestId = "";

      const pending = request.send({
        onBeforeSent: (data) => {
          requestId = data.requestId;
        },
        onResponse,
      });
      await waitFor(() => {
        expect(responses).toHaveLength(1);
      });
      vi.mocked(dispatcher.performRequest).mockImplementation(async () => undefined);

      dispatcher.delete(queryKey, requestId, abortKey);
      const result = await pending;
      release();
      await mapper.mock.results[0].value;

      expect((result.error as Error).message).toBe(getErrorMessage("deleted").message);
      expect(rollback).toHaveBeenCalledTimes(1);
      expect(rollback.mock.calls[0][0]).toMatchObject({ reason: "removed" });
      expect(invalidate).not.toHaveBeenCalled();
      expect(onResponse).not.toHaveBeenCalled();
    });

    it("should roll back aborted request with async mapper", async () => {
      const { mutation, rollback } = createSetup();
      const request = mutation.setResponseMapper(async (response) => response);
      mockRequest(request, { delay: 100 });

      await request.send({
        onRequestStart: () => {
          request.abort();
        },
      });

      expect(rollback).toHaveBeenCalledTimes(1);
      expect(rollback.mock.calls[0][0]).toMatchObject({ reason: "abort" });
    });
  });

  describe("when request is postponed", () => {
    it("should roll back and resolve when removed while waiting for a retry", async () => {
      const { mutation, rollback, dispatcher, queryKey, abortKey, responses, readList } = createSetup();
      // The retry timer is not part of this case
      vi.spyOn(dispatcher, "performRequest");
      const request = mutation.setRetry(1).setRetryTime(50);
      mockRequest(request, { status: 400 });
      let requestId = "";

      const pending = request.send({
        onBeforeSent: (data) => {
          requestId = data.requestId;
        },
      });
      await waitFor(() => {
        expect(responses).toHaveLength(1);
      });
      vi.mocked(dispatcher.performRequest).mockImplementation(async () => undefined);
      expect(rollback).not.toHaveBeenCalled();

      dispatcher.delete(queryKey, requestId, abortKey);
      const result = await pending;

      expect((result.error as Error).message).toBe(getErrorMessage("deleted").message);
      expect(rollback).toHaveBeenCalledTimes(1);
      expect(rollback.mock.calls[0][0]).toMatchObject({ reason: "removed" });
      expect(readList()).toStrictEqual(INITIAL_LIST);
    });

    it("should roll back and resolve when removed while waiting for the network", async () => {
      const { client, mutation, rollback, dispatcher, queryKey, abortKey, responses, readList } = createSetup();
      mockRequest(mutation, { status: 400, delay: 30 });
      let requestId = "";

      const pending = mutation.send({
        onBeforeSent: (data) => {
          requestId = data.requestId;
        },
        onRequestStart: () => {
          client.appManager.setOnline(false);
        },
      });
      await waitFor(() => {
        expect(responses).toHaveLength(1);
      });
      expect(rollback).not.toHaveBeenCalled();

      dispatcher.delete(queryKey, requestId, abortKey);
      const result = await pending;

      expect((result.error as Error).message).toBe(getErrorMessage("deleted").message);
      expect(rollback).toHaveBeenCalledTimes(1);
      expect(rollback.mock.calls[0][0]).toMatchObject({ reason: "removed" });
      expect(readList()).toStrictEqual(INITIAL_LIST);
    });

    it("should roll back and resolve when aborted while offline", async () => {
      const { client, mutation, rollback } = createSetup();
      mockRequest(mutation, { delay: 100 });

      const result = await mutation.send({
        onRequestStart: () => {
          client.appManager.setOnline(false);
          mutation.abort();
        },
      });

      expect((result.error as Error).message).toBe(getErrorMessage("abort").message);
      expect(rollback).toHaveBeenCalledTimes(1);
      expect(rollback.mock.calls[0][0]).toMatchObject({ reason: "abort" });
    });

    it("should treat offline failure as final when offline mode is disabled", async () => {
      const { client, mutation, rollback } = createSetup();
      const request = mutation.setOffline(false);
      mockRequest(request, { status: 400, delay: 30 });

      await request.send({
        onRequestStart: () => {
          client.appManager.setOnline(false);
        },
      });

      expect(rollback).toHaveBeenCalledTimes(1);
      expect(rollback.mock.calls[0][0]).toMatchObject({ reason: "error" });
    });

    it("should not settle again when stopped request is started later", async () => {
      const { mutation, rollback, invalidate, dispatcher, queryKey, responses } = createSetup();
      mockRequest(mutation, { delay: 50 });
      let requestId = "";
      let isFirstAttempt = true;

      const result = await mutation.send({
        onRequestStart: (data) => {
          requestId = data.requestId;
          if (isFirstAttempt) {
            isFirstAttempt = false;
            dispatcher.stopRequest(queryKey, requestId);
          }
        },
      });

      expect((result.error as Error).message).toBe(getErrorMessage("abort").message);
      expect(rollback).toHaveBeenCalledTimes(1);
      expect(rollback.mock.calls[0][0]).toMatchObject({ reason: "abort" });

      dispatcher.startRequest(queryKey, requestId);
      await waitFor(() => {
        expect(responses).toHaveLength(2);
      });

      expect(rollback).toHaveBeenCalledTimes(1);
      expect(invalidate).not.toHaveBeenCalled();
    });
  });

  describe("when multiple mutations are running", () => {
    const createItemMutation = (setup: Setup, item: string) => {
      const rollback = vi.fn(() => {
        setup.removeItem(item);
      });
      const request = setup.client
        .createRequest<{ response: null }>()({ endpoint: `/mutation/${item}`, method: "POST" })
        .setOptimistic(() => {
          setup.addItem(item);
          return { rollback };
        });
      return { request, rollback };
    };

    it("should roll back only the failed mutation", async () => {
      const setup = createSetup();
      const failed = createItemMutation(setup, "failed");
      const passed = createItemMutation(setup, "passed");
      mockRequest(failed.request, { status: 400, delay: 10 });
      mockRequest(passed.request, { delay: 30 });

      await Promise.all([failed.request.send(), passed.request.send()]);

      expect(failed.rollback).toHaveBeenCalledTimes(1);
      expect(passed.rollback).not.toHaveBeenCalled();
      expect(setup.readList()).toStrictEqual([SERVER_ITEM, "passed"]);
    });

    it("should roll back each failed mutation once", async () => {
      const setup = createSetup();
      const first = createItemMutation(setup, "first");
      const second = createItemMutation(setup, "second");
      mockRequest(first.request, { status: 400, delay: 30 });
      mockRequest(second.request, { status: 500, delay: 10 });

      await Promise.all([first.request.send(), second.request.send()]);

      expect(first.rollback).toHaveBeenCalledTimes(1);
      expect(second.rollback).toHaveBeenCalledTimes(1);
      expect(setup.readList()).toStrictEqual(INITIAL_LIST);
    });

    it("should roll back every send of the same request separately", async () => {
      const setup = createSetup();
      const rollbacks: ReturnType<typeof vi.fn>[] = [];
      const request = setup.client
        .createRequest<{ response: null }>()({ endpoint: "/mutation", method: "POST" })
        .setOptimistic(() => {
          const rollback = vi.fn();
          rollbacks.push(rollback);
          return { rollback };
        });
      mockRequest(request, { status: 400, delay: 10 });

      await Promise.all([request.send(), request.send()]);

      expect(rollbacks).toHaveLength(2);
      expect(rollbacks[0]).toHaveBeenCalledTimes(1);
      expect(rollbacks[1]).toHaveBeenCalledTimes(1);
    });

    it("should roll back every deduplicated send", async () => {
      const setup = createSetup();
      const rollbacks: ReturnType<typeof vi.fn>[] = [];
      const request = setup.client
        .createRequest<{ response: null }>()({ endpoint: "/mutation", method: "POST" })
        .setDeduplicate(true)
        .setOptimistic(() => {
          const rollback = vi.fn();
          rollbacks.push(rollback);
          return { rollback };
        });
      mockRequest(request, { status: 400, delay: 50 });

      await Promise.all([request.send(), request.send()]);

      expect(setup.responses).toHaveLength(1);
      expect(rollbacks).toHaveLength(2);
      expect(rollbacks[0]).toHaveBeenCalledTimes(1);
      expect(rollbacks[1]).toHaveBeenCalledTimes(1);
    });
  });

  describe("when using types", () => {
    const client = new Client({ url: "shared-base-url" });
    const request = client.createRequest<{ response: { id: number }; error: { code: string } }>()({
      endpoint: "/todos",
      method: "POST",
    });

    it("should type the rollback argument as a union discriminated by reason", () => {
      request.setOptimistic(() => ({
        rollback: (args) => {
          expectTypeOf(args.reason).toEqualTypeOf<"error" | "abort" | "removed">();

          if (args.reason === "removed") {
            expectTypeOf(args.response).toEqualTypeOf<undefined>();
          } else {
            expectTypeOf(args.response.data).toEqualTypeOf<{ id: number } | null>();
            expectTypeOf(args.response.success).toEqualTypeOf<boolean>();
          }
        },
      }));
    });

    it("should narrow destructured rollback argument", () => {
      request.setOptimistic(() => ({
        rollback: ({ reason, response }) => {
          if (reason !== "removed") {
            expectTypeOf(response.data).toEqualTypeOf<{ id: number } | null>();
          }
        },
      }));
    });

    it("should expose the request on the rollback argument", () => {
      request.setOptimistic(() => ({
        rollback: ({ request: sent }) => {
          expectTypeOf(sent.endpoint).toEqualTypeOf<typeof request.endpoint>();
          expectTypeOf(sent.method).toEqualTypeOf<typeof request.method>();
        },
      }));
    });

    it("should accept rollback declared without arguments", () => {
      request.setOptimistic(() => ({ rollback: () => undefined }));
    });

    it("should expose the argument through the public type", () => {
      type Args = OptimisticRollbackArgs<typeof request>;

      expectTypeOf<Args["reason"]>().toEqualTypeOf<"error" | "abort" | "removed">();
      expectTypeOf<Extract<Args, { reason: "removed" }>["response"]>().toEqualTypeOf<undefined>();
    });

    it("should reject unknown reasons", () => {
      request.setOptimistic(() => ({
        rollback: ({ reason }) => {
          // @ts-expect-error reason is limited to known settlement outcomes
          const isUnknown = reason === "timeout";
          return isUnknown ? undefined : undefined;
        },
      }));
    });
  });
});
