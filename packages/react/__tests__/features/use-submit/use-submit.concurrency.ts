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
      it("should share data between hooks", async () => {
        // Todo
      });
      it("should start in loading mode when request is already handled by the queue", async () => {
        // Todo
      });
      it("should not start in loading mode when request in queue is paused", async () => {
        // Todo
      });
      it("should not start in loading mode when queue is paused", async () => {
        // Todo
      });
    });
  });
});
