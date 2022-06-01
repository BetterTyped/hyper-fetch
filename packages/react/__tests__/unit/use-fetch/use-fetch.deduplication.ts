import { startServer, resetInterceptors, stopServer } from "../../server";

describe("useFetch [ Deduplication ]", () => {
  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetInterceptors();
  });

  afterAll(() => {
    stopServer();
  });

  beforeEach(async () => {
    jest.resetModules();
  });

  describe("given command deduplicate attribute is active", () => {
    describe("when initializing two hooks with the same command", () => {
      it("should send one request on init", async () => {});
      it("should perform one retry on failure", async () => {});
      it("should deduplicate requests within deduplication time", async () => {});
    });
  });
});
