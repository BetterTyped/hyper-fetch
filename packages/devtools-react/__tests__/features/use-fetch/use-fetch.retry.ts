import { createHttpMockingServer } from "@hyper-fetch/testing";

const { resetMocks, startServer, stopServer } = createHttpMockingServer();

describe("useFetch [ Retry ]", () => {
  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  beforeEach(() => {
    jest.resetModules();
  });

  describe("when request retry attribute is set to false", () => {
    it("should not retry request on failure", async () => {
      // Todo
    });
  });
  describe("when request retry attribute is set to true", () => {
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
