import { startServer, resetInterceptors, stopServer } from "../../server";

describe("useCommand [ Dependency Tracking ]", () => {
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

  describe("given dependency tracking is active", () => {
    describe("when updating the state values and dependency tracking is on", () => {
      it("should not rerender hook when deep equal values are the same", async () => {});
      it("should rerender component when attribute is used", async () => {});
      it("should not rerender component when attribute is not used", async () => {});
    });
  });
  describe("given dependency tracking is off", () => {
    describe("when updating the state values", () => {
      it("should rerender on any attribute change", async () => {});
    });
  });
});
