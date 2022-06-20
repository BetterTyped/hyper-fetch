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
    it("should return data from submit method", async () => {
      // Todo
    });
    it("should allow to change submit details", async () => {
      // Todo
    });
    it("should allow to pass data to submit", async () => {
      // Todo
    });
    it("should allow to pass params to submit", async () => {
      // Todo
    });
    it("should allow to pass query params to submit", async () => {
      // Todo
    });
  });
});
