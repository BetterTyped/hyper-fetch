import { waitFor } from "@testing-library/react";

import { getCacheKey } from "cache";
import { getAbortController } from "command";

import { resetMocks, startServer, stopServer, testBuilder } from "../../../utils/server";
import { getManyRequest, interceptGetMany } from "../../../utils/mocks";

const endpointKey = getCacheKey(getManyRequest);
const requestKey = "custom-key";

describe("Basic submitQueue usage", () => {
  beforeAll(() => {
    startServer();
  });

  beforeEach(async () => {
    testBuilder.clear();
  });

  afterEach(() => {
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When adding request to queue", () => {
    it("should add request to queue and trigger it", async () => {
      const trigger = jest.fn();
      interceptGetMany(200, 0);
      testBuilder.cache.events.get(requestKey, trigger);
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
      testBuilder.submitQueue.add(endpointKey, request);
      expect(testBuilder.submitQueue.getQueue(endpointKey)).toEqual([requestDump]);
      await waitFor(() => {
        expect(trigger).toBeCalled();
      });
    });

    it("should cancel already submitted request", async () => {
      const trigger = jest.fn();
      const cancelTrigger = jest.fn();
      interceptGetMany(200, 0);
      testBuilder.cache.events.get(requestKey, trigger);
      const request = {
        endpointKey,
        requestKey,
        request: getManyRequest.clone(),
        retries: 0,
        timestamp: new Date(),
      };
      request.request.cancelable = true;

      getAbortController(testBuilder, getManyRequest.abortKey)?.signal.addEventListener("abort", cancelTrigger);
      testBuilder.submitQueue.add(endpointKey, request);
      testBuilder.submitQueue.add(endpointKey, request);
      expect(cancelTrigger).toBeCalled();
      await waitFor(() => {
        expect(trigger).toBeCalledTimes(1);
      });
      getAbortController(testBuilder, getManyRequest.abortKey)?.signal.removeEventListener("abort", cancelTrigger);
    });

    it("should queue requests", async () => {
      interceptGetMany(200, 0);
      const request = {
        endpointKey,
        requestKey,
        request: getManyRequest.clone(),
        retries: 0,
        timestamp: new Date(),
      };
      request.request.queued = true;

      const requestDump = {
        endpointKey,
        requestKey,
        request: request.request.dump(),
        retries: 0,
        timestamp: +request.timestamp,
      };

      testBuilder.submitQueue.add(endpointKey, request);
      testBuilder.submitQueue.add(endpointKey, request);

      expect(testBuilder.submitQueue.getQueue(endpointKey)).toEqual([requestDump, requestDump]);
    });
  });
});
