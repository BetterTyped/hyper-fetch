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
    vi.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When cloning request", () => {
    it("should generate new keys", async () => {
      const clone = request.setParams({ userId: 1 }).clone();
      expect(clone.abortKey).toBe(request.abortKey);
      expect(clone.queryKey).not.toBe(request.queryKey);
      expect(clone.cacheKey).not.toBe(request.cacheKey);
    });
    it("should not generate new keys when we set custom ones", async () => {
      const clone = request.setAbortKey("test").setCacheKey("test").setQueryKey("test").clone().clone();

      expect(clone.abortKey).toBe("test");
      expect(clone.queryKey).toBe("test");
      expect(clone.cacheKey).toBe("test");
    });
    it("should not generate new keys when we set custom ones", async () => {
      const clone = request.setAbortKey("test").setCacheKey("test").setQueryKey("test").clone().clone();

      expect(clone.abortKey).toBe("test");
      expect(clone.queryKey).toBe("test");
      expect(clone.cacheKey).toBe("test");
    });
  });

  describe("When cloning request with a falsy payload", () => {
    const createPayloadRequest = () =>
      client.createRequest<{ payload: number | boolean | string }>()({ endpoint: "/users", method: "POST" });

    it.each([[0], [false], [""]])("should set the %j payload", (payload) => {
      expect(createPayloadRequest().setPayload(payload).payload).toBe(payload);
    });

    it.each([[0], [false], [""]])("should keep the %j payload in the next clones", (payload) => {
      const clone = createPayloadRequest().setPayload(payload).setHeaders({ "x-test": "1" }).clone();

      expect(clone.payload).toBe(payload);
    });

    it.each([[0], [false], [""]])("should replace the previous payload with %j", (payload) => {
      expect(createPayloadRequest().setPayload("previous").setPayload(payload).payload).toBe(payload);
    });

    it.each([[0], [false], [""]])("should pass the %j payload through the clone options", (payload) => {
      expect(createPayloadRequest().clone({ payload }).payload).toBe(payload);
    });

    it("should keep the payload when the clone does not change it", () => {
      expect(createPayloadRequest().setPayload("previous").clone({}).payload).toBe("previous");
      expect(createPayloadRequest().setPayload("previous").clone({ payload: undefined }).payload).toBe("previous");
    });
  });
});
