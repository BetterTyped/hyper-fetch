import { startServer, resetInterceptors, stopServer } from "../../server";

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

  beforeEach(() => {
    jest.resetModules();
  });

  describe("when submit method gets triggered", () => {
    it("should trigger request", async () => {});
  });
});
