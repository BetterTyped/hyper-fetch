import { startServer, resetInterceptors, stopServer } from "../../server";
import { builder } from "../../utils";

describe("useFetch [ Concurrency ]", () => {
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
    await builder.clear();
  });

  describe("given multiple rendered hooks", () => {
    describe("when used the same non-dedupe commands", () => {
      it("should allow to trigger request for each hook", async () => {});
      it("should start in loading mode when request is already handled by the queue", async () => {});
      it("should not start in loading mode when request in queue is paused", async () => {});
      it("should not start in loading mode when queue is paused", async () => {});
    });
  });
});
