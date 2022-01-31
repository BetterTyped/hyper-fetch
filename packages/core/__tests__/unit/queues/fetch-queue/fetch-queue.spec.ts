import { waitFor } from "@testing-library/dom";

import { getAbortController } from "command";

import { resetMocks, startServer, stopServer, testBuilder } from "../../../utils/server";
import { getManyRequest, interceptGetMany } from "../../../utils/mocks";
import { sleep } from "../../../utils/utils/sleep";

const { queueKey } = getManyRequest;

describe("[Basic] FetchQueue", () => {
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
      interceptGetMany(200, 500);
      testBuilder.cache.events.get(queueKey, cacheTrigger);

      testBuilder.fetchQueue.add(getManyRequest);

      await waitFor(() => {
        expect(cacheTrigger).toBeCalled();
      });
    });

    it("should cancel already submitted request", async () => {
      const cacheTrigger = jest.fn();
      const cancelTrigger = jest.fn();
      interceptGetMany(200, 100);
      testBuilder.cache.events.get(queueKey, cacheTrigger);

      const request = getManyRequest.setCancelable(true).setConcurrent(true);

      testBuilder.fetchQueue.add(request);
      await sleep(10);
      getAbortController(request)?.signal.addEventListener("abort", cancelTrigger);
      testBuilder.fetchQueue.add(request);
      await sleep(10);
      getAbortController(request)?.signal.addEventListener("abort", cancelTrigger);
      testBuilder.fetchQueue.add(request);
      await waitFor(() => {
        expect(cancelTrigger).toBeCalledTimes(2);
      });
      await waitFor(() => {
        expect(cacheTrigger).toBeCalledTimes(1);
      });
      getAbortController(getManyRequest)?.signal.removeEventListener("abort", cancelTrigger);
    });

    it("should deduplicate two submitted requests", async () => {
      const cacheTrigger = jest.fn();
      const cancelTrigger = jest.fn();
      interceptGetMany(200, 10);
      testBuilder.cache.events.get(queueKey, cacheTrigger);

      const request = getManyRequest;

      getAbortController(getManyRequest)?.signal.addEventListener("abort", cancelTrigger);
      testBuilder.fetchQueue.add(request);
      testBuilder.fetchQueue.add(request);

      await sleep(200);

      await waitFor(() => {
        expect(cacheTrigger).toBeCalledTimes(1);
      });
      getAbortController(getManyRequest)?.signal.removeEventListener("abort", cancelTrigger);
    });
  });
});
