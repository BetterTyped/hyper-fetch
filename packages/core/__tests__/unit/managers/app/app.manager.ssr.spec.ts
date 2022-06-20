import { createBuilder } from "../../../utils";
import { resetInterceptors, startServer, stopServer } from "../../../server";

describe("AppManager [ SSR ]", () => {
  let builder = createBuilder();

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    resetInterceptors();
    jest.resetAllMocks();
    builder = createBuilder();
  });

  afterAll(() => {
    stopServer();
  });

  describe("Given window is not available from beginning", () => {
    describe("When app manager is initialized", () => {
      it("should not throw without window", async () => {
        // Todo
      });
      it("should initialize and await for window to attach events", async () => {
        // Todo
      });
      it("should emit events after hydration", async () => {
        // Todo
      });
      it("should await to set initial isOnline value", async () => {
        // Todo
      });
      it("should await to set initial isFocused value", async () => {
        // Todo
      });
    });
  });
});
