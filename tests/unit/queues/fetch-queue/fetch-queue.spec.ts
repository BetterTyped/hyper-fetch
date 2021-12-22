import { waitFor } from "@testing-library/react";

import { CACHE_EVENTS, Cache, cacheEventEmitter, getCacheKey } from "cache";
import { FetchQueue, FETCH_QUEUE_EVENTS } from "queues";
import { getAbortController } from "command";

import { resetMocks, startServer, stopServer } from "../../../utils/server";
import { getManyRequest, interceptGetMany } from "../../../utils/mocks";
import { testBuilder } from "../../../utils/server/server.constants";

const endpointKey = getCacheKey(getManyRequest);
const requestKey = "custom-key";
let cacheInstance = new Cache(getManyRequest, requestKey);
let queueInstance = new FetchQueue(endpointKey, cacheInstance);

describe("Basic FetchQueue usage", () => {
  beforeAll(() => {
    startServer();
  });

  beforeEach(async () => {
    testBuilder.clear();
    cacheInstance = new Cache(getManyRequest, requestKey);
    queueInstance = new FetchQueue(endpointKey, cacheInstance);
  });

  afterEach(() => {
    resetMocks();
    cacheEventEmitter.removeAllListeners();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When adding request to queue", () => {
    it("should add request to queue and trigger it", async () => {
      const trigger = jest.fn();

      interceptGetMany(200, 0);
      CACHE_EVENTS.get(endpointKey, trigger);

      const request = {
        request: getManyRequest,
        retries: 0,
        timestamp: new Date(),
      };

      queueInstance.add(request);
      expect(queueInstance.get()).toBe(request);

      await waitFor(() => {
        expect(trigger).toBeCalled();
      });
    });

    it("should cancel already submitted request", async () => {
      const trigger = jest.fn();
      const cancelTrigger = jest.fn();

      interceptGetMany(200, 0);
      CACHE_EVENTS.get(endpointKey, trigger);

      const request = {
        request: getManyRequest,
        retries: 0,
        timestamp: new Date(),
      };

      getAbortController(getManyRequest.abortKey)?.signal.addEventListener("abort", cancelTrigger);

      queueInstance.add(request);
      expect(queueInstance.get()).toBe(request);
      queueInstance.add(request, { cancelable: true });

      expect(cancelTrigger).toBeCalled();

      await waitFor(() => {
        expect(trigger).toBeCalledTimes(1);
      });
      getAbortController(getManyRequest.abortKey)?.signal.removeEventListener("abort", cancelTrigger);
    });

    it("should allow to revalidate request and cancel previous", async () => {
      const trigger = jest.fn();
      const cancelTrigger = jest.fn();

      interceptGetMany(200, 0);
      CACHE_EVENTS.get(endpointKey, trigger);

      const request = {
        request: getManyRequest,
        retries: 0,
        timestamp: new Date(),
      };

      getAbortController(getManyRequest.abortKey)?.signal.addEventListener("abort", cancelTrigger);

      queueInstance.add(request);
      expect(queueInstance.get()).toBe(request);

      const requestRevalidate = {
        request: getManyRequest,
        retries: 0,
        timestamp: new Date(+new Date() + 100),
      };
      queueInstance.add(requestRevalidate, { isRevalidated: true });
      queueInstance.add(requestRevalidate, { isRevalidated: true });
      expect(cancelTrigger).toBeCalledTimes(1);

      getAbortController(getManyRequest.abortKey)?.signal.addEventListener("abort", cancelTrigger);

      const requestReRevalidate = {
        request: getManyRequest,
        retries: 0,
        timestamp: new Date(+new Date() + 200),
      };
      queueInstance.add(requestReRevalidate, { isRevalidated: true });
      expect(cancelTrigger).toBeCalledTimes(2);

      await waitFor(() => {
        expect(trigger).toBeCalledTimes(1);
      });
      getAbortController(getManyRequest.abortKey)?.signal.removeEventListener("abort", cancelTrigger);
    });

    it("should deduplicate simultaneous revalidation requests at the same time", async () => {
      const trigger = jest.fn();

      interceptGetMany(200, 0);

      FETCH_QUEUE_EVENTS.getLoading(endpointKey, trigger);

      const request = {
        request: getManyRequest,
        retries: 0,
        timestamp: new Date(),
      };

      queueInstance.add(request);
      await new Promise((r) => setTimeout(r, 1));

      const requestRevalidate = {
        request: getManyRequest,
        retries: 0,
        timestamp: new Date(+new Date() + 100),
      };
      queueInstance.add(requestRevalidate, { isRevalidated: true });
      queueInstance.add(requestRevalidate, { isRevalidated: true });
      queueInstance.add(requestRevalidate, { isRevalidated: true });
      await new Promise((r) => setTimeout(r, 1));

      const requestReRevalidate = {
        request: getManyRequest,
        retries: 0,
        timestamp: new Date(+new Date() + 200),
      };
      queueInstance.add(requestReRevalidate, { isRevalidated: true });
      queueInstance.add(requestReRevalidate, { isRevalidated: true });

      expect(trigger).toBeCalledTimes(3);
    });
  });
});
