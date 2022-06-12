import { startServer, resetInterceptors, stopServer } from "../../server";

describe("useSubmit [ Cancel ]", () => {
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

  describe("when aborting request", () => {
    it("should allow to cancel the ongoing request", async () => {});
  });
});
