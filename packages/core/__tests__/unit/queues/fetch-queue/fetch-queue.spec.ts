import { waitFor } from "@testing-library/dom";

import { getAbortController } from "command";

import { resetMocks, startServer, stopServer, testBuilder } from "../../../utils/server";
import { getManyRequest, interceptGetMany } from "../../../utils/mocks";
import { sleep } from "../../../utils/utils/sleep";

const { queueKey } = getManyRequest;

describe("Basic FetchQueue usage", () => {
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

      testBuilder.fetchQueue.add(getManyRequest);
      const queueElement = testBuilder.fetchQueue.get(queueKey);

      expect(queueElement?.commandDump).toEqual(getManyRequest.dump());
      expect(queueElement?.retries).toBe(0);
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

      getAbortController(getManyRequest)?.signal.addEventListener("abort", cancelTrigger);
      testBuilder.fetchQueue.add(request);
      testBuilder.fetchQueue.add(request);
      expect(cancelTrigger).toBeCalled();
      await waitFor(() => {
        expect(trigger).toBeCalledTimes(1);
      });
      getAbortController(getManyRequest)?.signal.removeEventListener("abort", cancelTrigger);
    });

    it("should allow to revalidate request and cancel previous", async () => {
      const trigger = jest.fn();
      const cancelTrigger = jest.fn();

      const request = getManyRequest.setCancelable(true);

      interceptGetMany(200, 0);
      testBuilder.cache.events.get(queueKey, trigger);
      testBuilder.fetchQueue.add(request);
      getAbortController(request)?.signal.addEventListener("abort", cancelTrigger);
      await sleep(20);
      expect(cancelTrigger).toBeCalledTimes(0);
      testBuilder.fetchQueue.add(request, { isRevalidated: true });
      testBuilder.fetchQueue.add(request, { isRevalidated: true });
      getAbortController(request)?.signal.addEventListener("abort", cancelTrigger);
      await sleep(20);
      expect(cancelTrigger).toBeCalledTimes(1);
      testBuilder.fetchQueue.add(request, { isRevalidated: true });
      testBuilder.fetchQueue.add(request, { isRevalidated: true });
      expect(cancelTrigger).toBeCalledTimes(2);
      await waitFor(() => {
        expect(trigger).toBeCalledTimes(1);
      });
      getAbortController(request)?.signal.removeEventListener("abort", cancelTrigger);
    });

    it("should deduplicate simultaneous revalidation requests at the same time", async () => {
      const trigger = jest.fn();
      interceptGetMany(200, 0);
      testBuilder.fetchQueue.events.getLoading(queueKey, trigger);
      testBuilder.fetchQueue.add(getManyRequest);
      await sleep(20);
      testBuilder.fetchQueue.add(getManyRequest, { isRevalidated: true });
      testBuilder.fetchQueue.add(getManyRequest, { isRevalidated: true });
      testBuilder.fetchQueue.add(getManyRequest, { isRevalidated: true });
      await sleep(20);
      testBuilder.fetchQueue.add(getManyRequest, { isRevalidated: true });
      testBuilder.fetchQueue.add(getManyRequest, { isRevalidated: true });
      testBuilder.fetchQueue.add(getManyRequest, { isRevalidated: true });
      expect(trigger).toBeCalledTimes(3);
    });
  });
});
