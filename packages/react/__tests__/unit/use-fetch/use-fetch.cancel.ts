import { startServer, resetInterceptors, stopServer } from "../../server";

describe("useFetch [ Cancel ]", () => {
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

  describe("given command is cancelable", () => {
    describe("when aborting request", () => {
      it("should allow to cancel the ongoing request", async () => {});
      it("should allow to cancel deduplicated request", async () => {});
      it("should cancel previous requests when dependencies change", async () => {});
    });
  });
});
