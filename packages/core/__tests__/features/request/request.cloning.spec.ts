import { createHttpMockingServer } from "@hyper-fetch/testing";

import { Client } from "client";

const { resetMocks, startServer, stopServer } = createHttpMockingServer();

describe("Request [ Cloning ]", () => {
  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest()({ endpoint: "/users/:userId" });
  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest()({ endpoint: "/users/:userId" });
    resetMocks();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When cloning request", () => {
    it("should generate new keys", async () => {
      const clone = request.setParams({ userId: 1 }).clone();
      expect(clone.abortKey).toBe(request.abortKey);
      expect(clone.queueKey).not.toBe(request.queueKey);
      expect(clone.cacheKey).not.toBe(request.cacheKey);
    });
    it("should not generate new keys when we set custom ones", async () => {
      const clone = request.setAbortKey("test").setCacheKey("test").setQueueKey("test").clone().clone();

      expect(clone.abortKey).toBe("test");
      expect(clone.queueKey).toBe("test");
      expect(clone.cacheKey).toBe("test");
    });
    it("should not generate new keys when we set custom ones", async () => {
      const clone = request.setAbortKey("test").setCacheKey("test").setQueueKey("test").clone().clone();

      expect(clone.abortKey).toBe("test");
      expect(clone.queueKey).toBe("test");
      expect(clone.cacheKey).toBe("test");
    });
  });
});
