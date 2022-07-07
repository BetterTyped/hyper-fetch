import { startServer, resetInterceptors, stopServer } from "../../../server";

describe("useCommand [ Base ]", () => {
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

  describe("given dependency tracking is active", () => {
    describe("when updating the state values and dependency tracking is on", () => {
      it("should not rerender hook when deep equal values are the same", async () => {
        // Todo
      });
      it("should rerender component when attribute is used", async () => {
        // Todo
      });
      it("should not rerender component when attribute is not used", async () => {
        // Todo
      });
    });
  });
  describe("given dependency tracking is off", () => {
    describe("when updating the state values", () => {
      it("should rerender on any attribute change", async () => {
        // Todo
      });
    });
  });
});
