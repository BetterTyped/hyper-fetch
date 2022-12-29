import { startServer, resetInterceptors, stopServer } from "../../../server";
import { createRequest, renderUseRequestEvents } from "../../../utils";

describe("useRequestEvents [ Utils ]", () => {
  let request = createRequest();

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
    request = createRequest();
  });

  describe("When handling lifecycle events", () => {
    it("should not throw when removing non existing event", async () => {
      const response = renderUseRequestEvents(request);

      expect(response.result.current[1].removeLifecycleListener).not.toThrow();
    });
  });
});
