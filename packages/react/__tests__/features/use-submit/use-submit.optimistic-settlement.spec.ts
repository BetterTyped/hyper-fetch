import type { OptimisticRollbackArgs, RequestInstance, RequestResponseEventType } from "@hyper-fetch/core";
import { Client, getErrorMessage, scopeKey } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useSubmit } from "hooks/use-submit";
import { StrictMode } from "react";

import { collectThrownErrors } from "../../utils/helpers.utils";

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

const waitForResponses = async (setup: Setup, count: number) => {
  await waitFor(() => {
    expect(setup.responses).toHaveLength(count);
  });
};

/**
 * Starts the submit inside of act and exposes its promise
 */
const startSubmit = (submit: (options?: any) => Promise<any>, options?: Record<string, unknown>) => {
  let pending: Promise<any> = Promise.resolve();
  act(() => {
    pending = submit(options);
  });
  return pending;
};

const finishSubmit = async (pending: Promise<any>) => {
  let result: any;
  await act(async () => {
    result = await pending;
  });
  return result;
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

type Scenario = {
  name: string;
  build?: (setup: Setup) => Mutation;
  arrange: (setup: Setup, request: Mutation) => Record<string, unknown> | void;
  drive?: (setup: Setup, request: Mutation) => Promise<void>;
  settled?: (setup: Setup) => Promise<void>;
  expected: {
    list: string[];
    invalidated: boolean;
    callback: "onSubmitSuccess" | "onSubmitError" | "onSubmitAbort" | null;
    rollback?: { reason: "error" | "abort" | "removed"; status?: number; errorMessage?: string };
  };
};

const scenarios: Scenario[] = [
  {
    name: "success",
    arrange: (_, request) => {
      mockRequest(request, { data: { ok: true } });
    },
    expected: { list: OPTIMISTIC_LIST, invalidated: true, callback: "onSubmitSuccess" },
  },
  {
    name: "final error",
    arrange: (_, request) => {
      mockRequest(request, { status: 400 });
    },
    expected: {
      list: INITIAL_LIST,
      invalidated: false,
      callback: "onSubmitError",
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
      callback: "onSubmitAbort",
      rollback: { reason: "abort", errorMessage: getErrorMessage("abort").message },
    },
  },
  {
    name: "queue removal",
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
    expected: { list: INITIAL_LIST, invalidated: false, callback: null, rollback: { reason: "removed" } },
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
    expected: { list: OPTIMISTIC_LIST, invalidated: true, callback: "onSubmitSuccess" },
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
      callback: "onSubmitError",
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
      act(() => {
        setup.client.appManager.setOnline(true);
      });
    },
    expected: { list: OPTIMISTIC_LIST, invalidated: true, callback: "onSubmitSuccess" },
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
      act(() => {
        setup.client.appManager.setOnline(true);
      });
    },
    expected: {
      list: INITIAL_LIST,
      invalidated: false,
      callback: "onSubmitError",
      rollback: { reason: "error", status: 500 },
    },
  },
];

describe("useSubmit [ Optimistic settlement ]", () => {
  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("when settling the submitted request", () => {
    it.each(scenarios)("should settle $name", async ({ build, arrange, drive, settled, expected }) => {
      const setup = createSetup();
      const request = build?.(setup) ?? setup.mutation;
      const callback = vi.fn();
      let sentRequest: RequestInstance | undefined;

      const options = arrange(setup, request) ?? {};
      const { result } = renderHook(() => useSubmit(request));
      act(() => {
        if (expected.callback) {
          result.current[expected.callback](callback);
        }
      });

      const pending = startSubmit(result.current.submit, {
        ...options,
        onBeforeSent: (data: { request: RequestInstance; requestId: string }) => {
          sentRequest = data.request;
          (options as { onBeforeSent?: (value: typeof data) => void }).onBeforeSent?.(data);
        },
      });

      await drive?.(setup, request);
      await finishSubmit(pending);
      await settled?.(setup);

      expect(setup.readList()).toStrictEqual(expected.list);

      if (expected.invalidated) {
        expect(setup.invalidate).toHaveBeenCalledTimes(1);
        expect(setup.invalidate).toHaveBeenCalledWith(setup.list);
      } else {
        expect(setup.invalidate).not.toHaveBeenCalled();
      }

      if (expected.rollback) {
        expect(setup.rollback).toHaveBeenCalledTimes(1);
        const [args] = setup.rollback.mock.calls[0];
        expect(args.reason).toBe(expected.rollback.reason);
        expect(args.request).toBe(sentRequest);
        if (expected.rollback.reason === "removed") {
          expect(args).not.toHaveProperty("response");
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

      if (expected.callback) {
        await waitFor(() => {
          expect(callback).toHaveBeenCalled();
        });
        const lastCall = callback.mock.calls.at(-1)?.[0];
        expect(lastCall.mutationContext).toStrictEqual({ item: OPTIMISTIC_ITEM });
      }
    });

    it("should report removal when aborting with the hook method", async () => {
      const setup = createSetup();
      mockRequest(setup.mutation, { delay: 100 });
      const { result } = renderHook(() => useSubmit(setup.mutation));

      const pending = startSubmit(result.current.submit, {
        onRequestStart: () => {
          result.current.abort();
        },
      });
      await finishSubmit(pending);
      await waitForResponses(setup, 1);

      expect(setup.rollback).toHaveBeenCalledTimes(1);
      expect(setup.rollback.mock.calls[0][0].reason).toBe("removed");
      expect(setup.readList()).toStrictEqual(INITIAL_LIST);
    });

    it("should have the cache rolled back when onSubmitError fires", async () => {
      const setup = createSetup();
      mockRequest(setup.mutation, { status: 400 });
      const { result } = renderHook(() => useSubmit(setup.mutation));
      let listInCallback: string[] | null | undefined;

      act(() => {
        result.current.onSubmitError(() => {
          listInCallback = setup.readList();
        });
      });
      await finishSubmit(startSubmit(result.current.submit));

      await waitFor(() => {
        expect(listInCallback).toStrictEqual(INITIAL_LIST);
      });
    });

    it("should fire callbacks when rollback throws", async () => {
      const thrown = collectThrownErrors();
      const setup = createSetup();
      setup.rollback.mockImplementation(() => {
        throw new Error("Rollback failed");
      });
      mockRequest(setup.mutation, { status: 400 });
      const { result } = renderHook(() => useSubmit(setup.mutation));
      const onError = vi.fn();
      const onFinished = vi.fn();

      act(() => {
        result.current.onSubmitError(onError);
        result.current.onSubmitFinished(onFinished);
      });
      const response = await finishSubmit(startSubmit(result.current.submit));

      expect(response.status).toBe(400);
      expect(setup.rollback).toHaveBeenCalledTimes(1);
      await waitFor(() => {
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onFinished).toHaveBeenCalledTimes(1);
      });
      await waitFor(() => {
        expect(thrown).toStrictEqual([new Error("Rollback failed")]);
      });
    });
  });

  describe("when component unmounts while the request is pending", () => {
    it("should roll back failed request", async () => {
      const setup = createSetup();
      mockRequest(setup.mutation, { status: 400, delay: 30 });
      const { result, unmount } = renderHook(() => useSubmit(setup.mutation));

      const pending = startSubmit(result.current.submit);
      await waitFor(() => {
        expect(setup.readList()).toStrictEqual(OPTIMISTIC_LIST);
      });
      unmount();
      const response = await pending;

      expect(response.status).toBe(400);
      expect(setup.rollback).toHaveBeenCalledTimes(1);
      expect(setup.rollback.mock.calls[0][0].reason).toBe("error");
      expect(setup.readList()).toStrictEqual(INITIAL_LIST);
    });

    it("should invalidate after successful request", async () => {
      const setup = createSetup();
      mockRequest(setup.mutation, { data: { ok: true }, delay: 30 });
      const { result, unmount } = renderHook(() => useSubmit(setup.mutation));

      const pending = startSubmit(result.current.submit);
      await waitFor(() => {
        expect(setup.readList()).toStrictEqual(OPTIMISTIC_LIST);
      });
      unmount();
      await pending;

      expect(setup.rollback).not.toHaveBeenCalled();
      expect(setup.invalidate).toHaveBeenCalledTimes(1);
      expect(setup.invalidate).toHaveBeenCalledWith(setup.list);
    });

    it("should roll back aborted request", async () => {
      const setup = createSetup();
      mockRequest(setup.mutation, { delay: 100 });
      const { result, unmount } = renderHook(() => useSubmit(setup.mutation));

      const pending = startSubmit(result.current.submit);
      await waitFor(() => {
        expect(setup.dispatcher.getAllRunningRequests()).toHaveLength(1);
      });
      unmount();
      setup.mutation.abort();
      await pending;

      expect(setup.rollback).toHaveBeenCalledTimes(1);
      expect(setup.rollback.mock.calls[0][0].reason).toBe("abort");
      expect(setup.readList()).toStrictEqual(INITIAL_LIST);
    });

    it("should roll back request removed from the queue", async () => {
      const setup = createSetup();
      setup.dispatcher.stop(setup.queryKey);
      const { result, unmount } = renderHook(() => useSubmit(setup.mutation));
      let requestId = "";

      const pending = startSubmit(result.current.submit, {
        onBeforeSent: (data: { requestId: string }) => {
          requestId = data.requestId;
        },
      });
      await waitFor(() => {
        expect(requestId).not.toBe("");
      });
      unmount();
      setup.dispatcher.delete(setup.queryKey, requestId, setup.abortKey);
      await pending;

      expect(setup.rollback).toHaveBeenCalledTimes(1);
      expect(setup.rollback.mock.calls[0][0].reason).toBe("removed");
      expect(setup.readList()).toStrictEqual(INITIAL_LIST);
    });

    it("should roll back once retries are exhausted", async () => {
      const setup = createSetup();
      const request = setup.mutation.setRetry(1).setRetryTime(10);
      mockRequest(request, { status: 400 });
      const { result, unmount } = renderHook(() => useSubmit(request));
      const unmountListener = setup.client.requestManager.events.onResponse(() => {
        unmountListener();
        unmount();
        mockRequest(request, { status: 500 });
      });

      await startSubmit(result.current.submit);

      expect(setup.responses).toHaveLength(2);
      expect(setup.rollback).toHaveBeenCalledTimes(1);
      // Status of the last attempt proves the first failure did not trigger the rollback
      expect(setup.rollback.mock.calls[0][0].response?.status).toBe(500);
      expect(setup.readList()).toStrictEqual(INITIAL_LIST);
    });
  });

  describe("when rendered in StrictMode", () => {
    it("should roll back failed request once", async () => {
      const setup = createSetup();
      mockRequest(setup.mutation, { status: 400 });
      const { result } = renderHook(() => useSubmit(setup.mutation), { wrapper: StrictMode });

      await finishSubmit(startSubmit(result.current.submit));

      expect(setup.rollback).toHaveBeenCalledTimes(1);
      expect(setup.readList()).toStrictEqual(INITIAL_LIST);
    });

    it("should invalidate successful request once", async () => {
      const setup = createSetup();
      mockRequest(setup.mutation, { data: { ok: true } });
      const { result } = renderHook(() => useSubmit(setup.mutation), { wrapper: StrictMode });

      await finishSubmit(startSubmit(result.current.submit));

      expect(setup.rollback).not.toHaveBeenCalled();
      expect(setup.invalidate).toHaveBeenCalledTimes(1);
    });

    it("should roll back once when unmounted while pending", async () => {
      const setup = createSetup();
      mockRequest(setup.mutation, { status: 400, delay: 30 });
      const { result, unmount } = renderHook(() => useSubmit(setup.mutation), { wrapper: StrictMode });

      const pending = startSubmit(result.current.submit);
      await waitFor(() => {
        expect(setup.readList()).toStrictEqual(OPTIMISTIC_LIST);
      });
      unmount();
      await pending;

      expect(setup.rollback).toHaveBeenCalledTimes(1);
      expect(setup.readList()).toStrictEqual(INITIAL_LIST);
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

    it("should roll back only the failed mutation of two hooks", async () => {
      const setup = createSetup();
      const failed = createItemMutation(setup, "failed");
      const passed = createItemMutation(setup, "passed");
      mockRequest(failed.request, { status: 400, delay: 10 });
      mockRequest(passed.request, { delay: 30 });
      const failedHook = renderHook(() => useSubmit(failed.request));
      const passedHook = renderHook(() => useSubmit(passed.request));

      await finishSubmit(
        Promise.all([startSubmit(failedHook.result.current.submit), startSubmit(passedHook.result.current.submit)]),
      );

      expect(failed.rollback).toHaveBeenCalledTimes(1);
      expect(passed.rollback).not.toHaveBeenCalled();
      expect(setup.readList()).toStrictEqual([SERVER_ITEM, "passed"]);
    });

    it("should roll back each of two failed mutations once", async () => {
      const setup = createSetup();
      const first = createItemMutation(setup, "first");
      const second = createItemMutation(setup, "second");
      mockRequest(first.request, { status: 400, delay: 30 });
      mockRequest(second.request, { status: 500, delay: 10 });
      const firstHook = renderHook(() => useSubmit(first.request));
      const secondHook = renderHook(() => useSubmit(second.request));

      await finishSubmit(
        Promise.all([startSubmit(firstHook.result.current.submit), startSubmit(secondHook.result.current.submit)]),
      );

      expect(first.rollback).toHaveBeenCalledTimes(1);
      expect(second.rollback).toHaveBeenCalledTimes(1);
      expect(setup.readList()).toStrictEqual(INITIAL_LIST);
    });

    it("should roll back two submits of one hook separately", async () => {
      const setup = createSetup();
      const rollbacks: Record<string, ReturnType<typeof vi.fn>> = {};
      const request = setup.client
        .createRequest<{ response: null; payload: { item: string } }>()({ endpoint: "/mutation", method: "POST" })
        .setOptimistic(({ payload }) => {
          setup.addItem(payload.item);
          const rollback = vi.fn(() => {
            setup.removeItem(payload.item);
          });
          rollbacks[payload.item] = rollback;
          return { rollback };
        });
      mockRequest(request, { status: 400, delay: 20 });
      const { result } = renderHook(() => useSubmit(request));

      await finishSubmit(
        Promise.all([
          startSubmit(result.current.submit, { payload: { item: "first" } }),
          startSubmit(result.current.submit, { payload: { item: "second" } }),
        ]),
      );

      expect(rollbacks.first).toHaveBeenCalledTimes(1);
      expect(rollbacks.second).toHaveBeenCalledTimes(1);
      expect(setup.readList()).toStrictEqual(INITIAL_LIST);
    });

    it("should roll back once when two hooks observe the same request", async () => {
      const setup = createSetup();
      mockRequest(setup.mutation, { status: 400 });
      const submitting = renderHook(() => useSubmit(setup.mutation));
      renderHook(() => useSubmit(setup.mutation));

      await finishSubmit(startSubmit(submitting.result.current.submit));

      expect(setup.rollback).toHaveBeenCalledTimes(1);
    });
  });
});
