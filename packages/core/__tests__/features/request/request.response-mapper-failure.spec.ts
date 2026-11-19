import { createHttpMockingServer } from "@hyper-fetch/testing";
import { waitFor } from "@testing-library/dom";
import { getErrorMessage } from "adapter";
import { Client } from "client";
import type { OptimisticRollbackArgs } from "request";
import { scopeKey } from "request";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

const MAPPER_ERROR = new Error("Mapper failed");
const SERVER_ITEM = "server";
const OPTIMISTIC_ITEM = "optimistic";
const INITIAL_LIST = [SERVER_ITEM];

// Failing mappers keep the response type, otherwise the mapped request would be typed with `never`
type FailingMapper = <Response>(response: Response) => Response | Promise<Response>;

const rejectingMapper: FailingMapper = async () => {
  throw MAPPER_ERROR;
};

const throwingMapper: FailingMapper = () => {
  throw MAPPER_ERROR;
};

const failures = [
  { name: "rejects", mapper: rejectingMapper },
  { name: "throws synchronously", mapper: throwingMapper },
];

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

  const rollback = vi.fn((_args: OptimisticRollbackArgs<any>) => {
    client.cache.update(list, (prev) => ({
      data: (prev?.data ?? []).filter((value) => value !== OPTIMISTIC_ITEM),
    }));
  });
  const invalidate = vi.spyOn(client.cache, "invalidate");
  const logError = vi.spyOn(client.logger, "error");

  const request = client.createRequest<{ response: { ok: boolean } }>()({ endpoint: "/mutation", method: "POST" });
  const mutation = request.setOptimistic(() => {
    client.cache.update(list, (prev) => ({ data: [...(prev?.data ?? []), OPTIMISTIC_ITEM] }));
    return { rollback, invalidate: [list] };
  });

  const getListeners = (requestId: string) => {
    return client.requestManager.emitter.eventNames().filter((name) => String(name).includes(requestId));
  };

  return { client, list, request, mutation, rollback, invalidate, logError, readList, getListeners };
};

describe("Request [ Response mapper failure ]", () => {
  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe.each(failures)("when the mapper $name", ({ mapper }) => {
    it("should resolve with failed response carrying the mapper error", async () => {
      const { request } = createSetup();
      const mapped = request.setResponseMapper(mapper);
      mockRequest(mapped, { data: { ok: true }, status: 200 });

      const result = await mapped.send();

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe(MAPPER_ERROR);
      expect(result.status).toBe(200);
    });

    it("should log the failure once", async () => {
      const { request, logError } = createSetup();
      const mapped = request.setResponseMapper(mapper);
      mockRequest(mapped);

      await mapped.send();

      const logs = logError.mock.calls.filter(([log]) => log.title === "Response mapper failed");
      expect(logs).toHaveLength(1);
      expect(logs[0][0].extra).toMatchObject({ error: MAPPER_ERROR });
    });

    it("should clean up the listeners", async () => {
      const { request, getListeners } = createSetup();
      const mapped = request.setResponseMapper(mapper);
      mockRequest(mapped);
      let requestId = "";
      let attachedListeners = 0;

      await mapped.send({
        onBeforeSent: (data) => {
          requestId = data.requestId;
        },
        onRequestStart: () => {
          attachedListeners = getListeners(requestId).length;
        },
      });

      expect(attachedListeners).toBeGreaterThan(0);
      expect(getListeners(requestId)).toHaveLength(0);
    });

    it("should notify about the response once", async () => {
      const { request } = createSetup();
      const mapped = request.setResponseMapper(mapper);
      mockRequest(mapped);
      const onResponse = vi.fn();

      await mapped.send({ onResponse });

      expect(onResponse).toHaveBeenCalledTimes(1);
    });

    it("should roll back the optimistic change once with error reason", async () => {
      const { mutation, rollback, invalidate, readList } = createSetup();
      const mapped = mutation.setResponseMapper(mapper);
      mockRequest(mapped, { data: { ok: true } });

      const result = await mapped.send();

      expect(rollback).toHaveBeenCalledTimes(1);
      expect(rollback.mock.calls[0][0]).toMatchObject({ reason: "error" });
      expect(rollback.mock.calls[0][0].response?.error).toBe(MAPPER_ERROR);
      expect(result.error).toBe(MAPPER_ERROR);
      expect(readList()).toEqual(INITIAL_LIST);
      expect(invalidate).not.toHaveBeenCalled();
    });

    it("should roll back aborted request with abort reason", async () => {
      const { mutation, rollback } = createSetup();
      const mapped = mutation.setResponseMapper(mapper);
      mockRequest(mapped, { delay: 100 });

      const result = await mapped.send({
        onRequestStart: () => {
          mapped.abort();
        },
      });

      expect(result.success).toBe(false);
      expect(rollback).toHaveBeenCalledTimes(1);
      expect(rollback.mock.calls[0][0]).toMatchObject({ reason: "abort" });
    });

    it("should roll back once after the retries are used up", async () => {
      const { client, mutation, rollback } = createSetup();
      let attempts = 0;
      const failingMapper: FailingMapper = (response) => {
        attempts += 1;
        return mapper(response);
      };
      const mapped = mutation.setRetry(1).setRetryTime(10).setResponseMapper(failingMapper);
      mockRequest(mapped, { status: 400 });
      const onResponse = vi.fn();
      client.requestManager.events.onResponse(onResponse);

      const result = await mapped.send();

      expect(onResponse).toHaveBeenCalledTimes(2);
      expect(attempts).toBe(2);
      expect(result.error).toBe(MAPPER_ERROR);
      expect(rollback).toHaveBeenCalledTimes(1);
      expect(rollback.mock.calls[0][0]).toMatchObject({ reason: "error" });
    });

    it("should wait for the retry when the failed attempt can't be mapped", async () => {
      const { client, mutation, rollback, invalidate, list } = createSetup();
      let attempts = 0;
      const failingOnceMapper: FailingMapper = (response) => {
        attempts += 1;
        return attempts === 1 ? mapper(response) : response;
      };
      const mapped = mutation.setRetry(1).setRetryTime(10).setResponseMapper(failingOnceMapper);
      mockRequest(mapped, { status: 400 });
      const unmount = client.requestManager.events.onResponse(() => {
        unmount();
        mockRequest(mapped, { data: { ok: true } });
      });

      const result = await mapped.send();

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(rollback).not.toHaveBeenCalled();
      expect(invalidate).toHaveBeenCalledWith(list);
    });

    it("should wait for the reconnection when the offline attempt can't be mapped", async () => {
      const { client, mutation, rollback, invalidate, list } = createSetup();
      let attempts = 0;
      const failingOnceMapper: FailingMapper = (response) => {
        attempts += 1;
        return attempts === 1 ? mapper(response) : response;
      };
      const mapped = mutation.setResponseMapper(failingOnceMapper);
      mockRequest(mapped, { status: 400, delay: 30 });
      const onAttempt = vi.fn();
      const unmount = client.requestManager.events.onResponse(() => {
        unmount();
        mockRequest(mapped, { data: { ok: true } });
        onAttempt();
      });
      let isFirstAttempt = true;

      const pending = mapped.send({
        onRequestStart: () => {
          if (isFirstAttempt) {
            isFirstAttempt = false;
            client.appManager.setOnline(false);
          }
        },
      });
      await waitFor(() => {
        expect(onAttempt).toHaveBeenCalledTimes(1);
      });
      expect(rollback).not.toHaveBeenCalled();

      client.appManager.setOnline(true);
      const result = await pending;

      expect(result.success).toBe(true);
      expect(rollback).not.toHaveBeenCalled();
      expect(invalidate).toHaveBeenCalledWith(list);
    });

    it.each(["cache-first", "revalidate"] as const)(
      "should resolve with failed response for cached data with %s policy",
      async (cachePolicy) => {
        const { request, client, logError } = createSetup();
        const mapped = request.setResponseMapper(mapper);
        mockRequest(mapped, { data: { ok: true } });
        client.cache.set(mapped, {
          data: { ok: true },
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
          responseTimestamp: Date.now(),
        });

        const result = await mapped.send({ cachePolicy });

        expect(result.success).toBe(false);
        expect(result.error).toBe(MAPPER_ERROR);
        await waitFor(() => {
          expect(logError).toHaveBeenCalled();
        });
      },
    );
  });

  describe("when the mapper rejects with non-error value", () => {
    it("should carry the value as it is", async () => {
      const { request } = createSetup();
      const reason = { code: "INVALID_SHAPE" };
      const failingMapper: FailingMapper = async () => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw reason;
      };
      const mapped = request.setResponseMapper(failingMapper);
      mockRequest(mapped);

      const result = await mapped.send();

      expect(result.success).toBe(false);
      expect(result.error).toBe(reason);
    });
  });

  describe("when the request gets removed before the mapper rejects", () => {
    it("should settle only with the removal", async () => {
      const { client, mutation, rollback, invalidate } = createSetup();
      const dispatcher = client.submitDispatcher;
      // The retry timer is not part of this case
      vi.spyOn(dispatcher, "performRequest");
      let release: VoidFunction = () => undefined;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      let mapping: Promise<never> | undefined;
      const mapper: FailingMapper = () => {
        mapping = gate.then(() => {
          throw MAPPER_ERROR;
        });
        return mapping;
      };
      const mapped = mutation.setRetry(1).setRetryTime(50).setResponseMapper(mapper);
      mockRequest(mapped, { status: 400 });
      const onResponse = vi.fn();
      const onAttempt = vi.fn();
      client.requestManager.events.onResponse(onAttempt);
      let requestId = "";

      const pending = mapped.send({
        onBeforeSent: (data) => {
          requestId = data.requestId;
        },
        onResponse,
      });
      await waitFor(() => {
        expect(onAttempt).toHaveBeenCalledTimes(1);
      });
      vi.mocked(dispatcher.performRequest).mockImplementation(async () => undefined);

      dispatcher.delete(scopeKey(mapped.queryKey, mapped.scope), requestId, scopeKey(mapped.abortKey, mapped.scope));
      const result = await pending;
      release();
      await expect(mapping).rejects.toBe(MAPPER_ERROR);
      // Handlers of the rejection run after the promise above is settled
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      expect((result.error as Error).message).toBe(getErrorMessage("deleted").message);
      expect(rollback).toHaveBeenCalledTimes(1);
      expect(rollback.mock.calls[0][0]).toMatchObject({ reason: "removed" });
      expect(invalidate).not.toHaveBeenCalled();
      expect(onResponse).not.toHaveBeenCalled();
    });
  });
});
