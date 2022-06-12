import { startServer, resetInterceptors, stopServer } from "../../server";

describe("useSubmit [ Concurrency ]", () => {
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

  describe("given multiple rendered hooks", () => {
    describe("when used commands are equal", () => {
      it("should share data between hooks", async () => {});
      it("should start in loading mode when request is already handled by the queue", async () => {});
      it("should not start in loading mode when request in queue is paused", async () => {});
      it("should not start in loading mode when queue is paused", async () => {});
    });
  });
});
