import { waitFor } from "@testing-library/react";
import { act } from "@testing-library/react-hooks/dom";

import { CACHE_EVENTS, cacheEventEmitter, getCacheKey } from "cache";
import { FETCH_QUEUE_EVENTS } from "queues";
import { getAbortController } from "command";

import { resetMocks, startServer, stopServer, testBuilder } from "../../../utils/server";
import { getManyRequest, interceptGetMany } from "../../../utils/mocks";

const endpointKey = getCacheKey(getManyRequest);
const requestKey = "custom-key";

describe("Basic FetchQueue usage", () => {
  beforeAll(() => {
    startServer();
  });

  beforeEach(async () => {
    testBuilder.clear();
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
      CACHE_EVENTS.get(requestKey, trigger);
      const request = {
        endpointKey,
        requestKey,
        request: getManyRequest,
        retries: 0,
        timestamp: new Date(),
      };
      const requestDump = {
        endpointKey,
        requestKey,
        request: getManyRequest.dump(),
        retries: 0,
        timestamp: +request.timestamp,
      };
      testBuilder.fetchQueue.add(request);
      expect(testBuilder.fetchQueue.get(endpointKey)).toEqual(requestDump);
      await waitFor(() => {
        expect(trigger).toBeCalled();
      });
    });

    it("should cancel already submitted request", async () => {
      const trigger = jest.fn();
      const cancelTrigger = jest.fn();
      interceptGetMany(200, 0);
      CACHE_EVENTS.get(requestKey, trigger);
      const request = {
        endpointKey,
        requestKey,
        request: getManyRequest.clone(),
        retries: 0,
        timestamp: new Date(),
      };
      request.request.cancelable = true;

      getAbortController(getManyRequest.abortKey)?.signal.addEventListener("abort", cancelTrigger);
      testBuilder.fetchQueue.add(request);
      testBuilder.fetchQueue.add(request);
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
      CACHE_EVENTS.get(requestKey, trigger);
      const request = {
        endpointKey,
        requestKey,
        request: getManyRequest,
        retries: 0,
        timestamp: new Date(),
      };
      getAbortController(getManyRequest.abortKey)?.signal.addEventListener("abort", cancelTrigger);
      testBuilder.fetchQueue.add(request);
      const requestRevalidate = {
        endpointKey,
        requestKey,
        request: getManyRequest,
        retries: 0,
        timestamp: new Date(+new Date() + 100),
      };
      testBuilder.fetchQueue.add(requestRevalidate, { isRevalidated: true });
      testBuilder.fetchQueue.add(requestRevalidate, { isRevalidated: true });
      expect(cancelTrigger).toBeCalledTimes(1);
      getAbortController(getManyRequest.abortKey)?.signal.addEventListener("abort", cancelTrigger);
      const requestReRevalidate = {
        endpointKey,
        requestKey,
        request: getManyRequest,
        retries: 0,
        timestamp: new Date(+new Date() + 200),
      };
      testBuilder.fetchQueue.add(requestReRevalidate, { isRevalidated: true });
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
      await act(async () => {
        const request = {
          endpointKey,
          requestKey,
          request: getManyRequest,
          retries: 0,
          timestamp: new Date(),
        };
        testBuilder.fetchQueue.add(request);
        await new Promise((r) => setTimeout(r, 1));
        const requestRevalidate = {
          endpointKey,
          requestKey,
          request: getManyRequest,
          retries: 0,
          timestamp: new Date(+new Date() + 100),
        };
        testBuilder.fetchQueue.add(requestRevalidate, { isRevalidated: true });
        testBuilder.fetchQueue.add(requestRevalidate, { isRevalidated: true });
        testBuilder.fetchQueue.add(requestRevalidate, { isRevalidated: true });
        await new Promise((r) => setTimeout(r, 1));
        const requestReRevalidate = {
          endpointKey,
          requestKey,
          request: getManyRequest,
          retries: 0,
          timestamp: new Date(+new Date() + 200),
        };
        testBuilder.fetchQueue.add(requestReRevalidate, { isRevalidated: true });
        testBuilder.fetchQueue.add(requestReRevalidate, { isRevalidated: true });
      });
      expect(trigger).toBeCalledTimes(3);
    });
  });
});
