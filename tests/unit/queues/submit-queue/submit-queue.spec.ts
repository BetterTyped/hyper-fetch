import { waitFor } from "@testing-library/react";

import { getAbortController } from "command";

import { resetMocks, startServer, stopServer, testBuilder } from "../../../utils/server";
import { getManyRequest, interceptGetMany } from "../../../utils/mocks";

const { queueKey } = getManyRequest;

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
      testBuilder.cache.events.get(queueKey, trigger);

      const requestDump = {
        commandDump: getManyRequest.dump(),
        retries: 0,
        timestamp: +new Date(),
      };
      testBuilder.submitQueue.add(getManyRequest);
      expect(testBuilder.submitQueue.getQueue(queueKey)).toEqual([requestDump]);
      await waitFor(() => {
        expect(trigger).toBeCalled();
      });
    });

    it("should cancel already submitted request", async () => {
      const trigger = jest.fn();
      const cancelTrigger = jest.fn();
      interceptGetMany(200, 0);
      testBuilder.cache.events.get(queueKey, trigger);
      const request = getManyRequest.setCancelable(true);

      getAbortController(testBuilder, getManyRequest.abortKey)?.signal.addEventListener("abort", cancelTrigger);
      testBuilder.submitQueue.add(request);
      testBuilder.submitQueue.add(request);
      expect(cancelTrigger).toBeCalled();
      await waitFor(() => {
        expect(trigger).toBeCalledTimes(1);
      });
      getAbortController(testBuilder, getManyRequest.abortKey)?.signal.removeEventListener("abort", cancelTrigger);
    });

    it("should queue requests", async () => {
      interceptGetMany(200, 0);
      const request = getManyRequest.setQueued(true);

      const requestDump = {
        commandDump: request.dump(),
        retries: 0,
        timestamp: +new Date(),
      };

      testBuilder.submitQueue.add(request);
      testBuilder.submitQueue.add(request);

      expect(testBuilder.submitQueue.getQueue(queueKey)).toEqual([requestDump, requestDump]);
    });
  });
});
