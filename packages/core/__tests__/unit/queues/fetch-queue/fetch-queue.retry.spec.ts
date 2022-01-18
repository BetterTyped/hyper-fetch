import { waitFor } from "@testing-library/dom";

import { resetMocks, startServer, stopServer, testBuilder } from "../../../utils/server";
import { getManyRequest, interceptGetMany } from "../../../utils/mocks";
import { sleep } from "../../../utils/utils/sleep";

const { queueKey } = getManyRequest;

describe("[Retry] FetchQueue", () => {
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
    it("should not retry failed request when command 'retry' option is disabled", async () => {
      const loadingTrigger = jest.fn();
      interceptGetMany(400, 0);

      testBuilder.fetchQueue.events.getLoading(queueKey, loadingTrigger);

      const request = getManyRequest.setRetry(false);
      testBuilder.fetchQueue.add(request);

      await sleep(100);

      await waitFor(() => {
        expect(loadingTrigger).toBeCalledTimes(1);
      });
    });
  });
});
