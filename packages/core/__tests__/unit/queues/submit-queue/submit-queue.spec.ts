import { waitFor } from "@testing-library/dom";

import { getAbortController } from "command";

import { resetMocks, startServer, stopServer, testBuilder } from "../../../utils/server";
import { getManyRequest, interceptGetMany } from "../../../utils/mocks";

const { queueKey, cacheKey } = getManyRequest;

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
      const cacheTrigger = jest.fn();
      interceptGetMany(200);
      testBuilder.cache.events.get(cacheKey, cacheTrigger);

      testBuilder.submitQueue.add(getManyRequest);

      const queue = testBuilder.submitQueue.getQueue(queueKey);
      const queueElement = queue?.[0];

      expect(queueElement?.commandDump).toEqual(getManyRequest.dump());
      expect(queueElement?.retries).toBe(0);
      expect(queue?.length).toBe(1);

      await waitFor(() => {
        expect(cacheTrigger).toBeCalledTimes(1);
      });
    });

    it("should cancel already submitted request", async () => {
      const trigger = jest.fn();
      const cancelTrigger = jest.fn();
      interceptGetMany(200);
      const request = getManyRequest.setCancelable(true);
      testBuilder.cache.events.get(request.cacheKey, trigger);

      const controller = getAbortController(request) as AbortController;

      controller.signal.addEventListener("abort", cancelTrigger);
      controller.abort();

      testBuilder.submitQueue.add(request);
      testBuilder.submitQueue.add(request);
      expect(cancelTrigger).toBeCalled();
      await waitFor(() => {
        expect(trigger).toBeCalledTimes(1);
      });
      controller.signal.removeEventListener("abort", cancelTrigger);
    });

    it("should queue requests", async () => {
      interceptGetMany(200);
      const request = getManyRequest.setQueued(true);

      testBuilder.submitQueue.add(request);
      testBuilder.submitQueue.add(request);

      const queue = testBuilder.submitQueue.getQueue(queueKey);
      const firstQueueElement = queue?.[0];
      const secondQueueElement = queue?.[1];

      expect(firstQueueElement?.commandDump).toEqual(request.dump());
      expect(firstQueueElement?.retries).toBe(0);
      expect(secondQueueElement?.commandDump).toEqual(request.dump());
      expect(secondQueueElement?.retries).toBe(0);
      expect(queue?.length).toBe(2);
    });
  });
});
