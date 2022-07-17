import { startServer, resetInterceptors, stopServer } from "../../../server";

describe("useTrackedState [ Actions ]", () => {
  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetInterceptors();
  });

  afterAll(() => {
    stopServer();
  });

  beforeEach(() => {
    jest.resetModules();
  });

  describe("when updating the local state", () => {
    it("should allow to set data", async () => {
      // Todo
    });
    it("should allow to set error", async () => {
      // Todo
    });
    it("should allow to set loading", async () => {
      // Todo
    });
    it("should allow to set status", async () => {
      // Todo
    });
    it("should allow to set timestamp", async () => {
      // Todo
    });
  });
  describe("when updating the cache state", () => {
    it("should allow to set data", async () => {
      // Todo
    });
    it("should allow to set error", async () => {
      // Todo
    });
    it("should allow to set loading", async () => {
      // Todo
    });
    it("should allow to set status", async () => {
      // Todo
    });
    it("should allow to set timestamp", async () => {
      // Todo
    });
  });
});
