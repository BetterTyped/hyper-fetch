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
      const cacheTrigger = jest.fn();
      interceptGetMany(200);
      testBuilder.cache.events.get(queueKey, cacheTrigger);

      testBuilder.fetchQueue.add(getManyRequest);
      const queueElement = testBuilder.fetchQueue.get(queueKey);

      expect(queueElement?.commandDump).toEqual(getManyRequest.dump());
      expect(queueElement?.retries).toBe(0);
      await waitFor(() => {
        expect(cacheTrigger).toBeCalled();
      });
    });

    it("should cancel already submitted request", async () => {
      const cacheTrigger = jest.fn();
      const cancelTrigger = jest.fn();
      interceptGetMany(200);
      testBuilder.cache.events.get(queueKey, cacheTrigger);

      const request = getManyRequest.setCancelable(true);

      getAbortController(getManyRequest)?.signal.addEventListener("abort", cancelTrigger);
      testBuilder.fetchQueue.add(request);
      testBuilder.fetchQueue.add(request);
      expect(cancelTrigger).toBeCalled();
      await waitFor(() => {
        expect(cacheTrigger).toBeCalledTimes(1);
      });
      getAbortController(getManyRequest)?.signal.removeEventListener("abort", cancelTrigger);
    });

    it("should allow to revalidate request and cancel previous", async () => {
      const cacheTrigger = jest.fn();
      const cancelTrigger = jest.fn();

      const request = getManyRequest.setCancelable(true);

      testBuilder.cache.events.get(queueKey, cacheTrigger);

      interceptGetMany(200);
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
        expect(cacheTrigger).toBeCalledTimes(1);
      });
      getAbortController(request)?.signal.removeEventListener("abort", cancelTrigger);
    });

    it("should deduplicate simultaneous revalidation requests at the same time", async () => {
      const loadingTrigger = jest.fn();
      interceptGetMany(200);
      testBuilder.fetchQueue.events.getLoading(queueKey, loadingTrigger);
      testBuilder.fetchQueue.add(getManyRequest);
      await sleep(20);
      testBuilder.fetchQueue.add(getManyRequest, { isRevalidated: true });
      testBuilder.fetchQueue.add(getManyRequest, { isRevalidated: true });
      testBuilder.fetchQueue.add(getManyRequest, { isRevalidated: true });
      await sleep(20);
      testBuilder.fetchQueue.add(getManyRequest, { isRevalidated: true });
      testBuilder.fetchQueue.add(getManyRequest, { isRevalidated: true });
      testBuilder.fetchQueue.add(getManyRequest, { isRevalidated: true });
      expect(loadingTrigger).toBeCalledTimes(3);
    });
  });
});
