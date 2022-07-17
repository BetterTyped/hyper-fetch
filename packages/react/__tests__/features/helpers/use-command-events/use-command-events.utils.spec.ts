import { startServer, resetInterceptors, stopServer } from "../../../server";
import { createCommand, renderUseCommandEvents } from "../../../utils";

describe("useCommandEvents [ Utils ]", () => {
  let command = createCommand();

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
    command = createCommand();
  });

  describe("When handling lifecycle events", () => {
    it("should not throw when removing non existing event", async () => {
      const response = renderUseCommandEvents(command);

      expect(response.result.current[1].removeLifecycleListener).not.toThrow();
    });
  });
});
