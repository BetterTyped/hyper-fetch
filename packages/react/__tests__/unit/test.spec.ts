import { startServer, resetInterceptors, stopServer } from "../server";

describe("useSubmit [ Base ]", () => {
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

  describe("Test", () => {
    it("Should pass", () => {
      expect(true).toBeTrue();
    });
  });
});
