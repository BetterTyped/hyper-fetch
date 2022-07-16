import { startServer, resetInterceptors, stopServer } from "../../server";

describe("useFetch [ Retry ]", () => {
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

  describe("when command retry attribute is set to false", () => {
    it("should not retry request on failure", async () => {
      // Todo
    });
  });
  describe("when command retry attribute is set to true", () => {
    it("should retry request once", async () => {
      // Todo
    });
    it("should retry request twice", async () => {
      // Todo
    });
    it("should trigger retries with the config interval", async () => {
      // Todo
    });
  });
});
