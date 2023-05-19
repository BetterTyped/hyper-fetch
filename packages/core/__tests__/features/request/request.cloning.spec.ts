import { Client } from "client";
import { resetInterceptors, startServer, stopServer } from "../../server";

describe("Request [ Cloning ]", () => {
  const endpoint = "/users/:userId";

  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest()({ endpoint });
  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest()({ endpoint });
    resetInterceptors();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When cloning request", () => {
    it("should generate new keys", async () => {
      const clone = request.setParams({ userId: 1 } as null).clone();
      expect(clone.abortKey).toBe(request.abortKey);
      expect(clone.queueKey).toBe(request.queueKey);
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
