import { startServer, resetInterceptors, stopServer } from "../../server";

describe("useCommand [ Actions ]", () => {
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

  describe("when updating the local state", () => {
    it("should allow to set data", async () => {});
    it("should allow to set error", async () => {});
    it("should allow to set loading", async () => {});
    it("should allow to set status", async () => {});
    it("should allow to set timestamp", async () => {});
  });
  describe("when updating the cache state", () => {
    it("should allow to set data", async () => {});
    it("should allow to set error", async () => {});
    it("should allow to set loading", async () => {});
    it("should allow to set status", async () => {});
    it("should allow to set timestamp", async () => {});
  });
});
