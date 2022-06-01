import { startServer, resetInterceptors, stopServer } from "../../server";

describe("useFetch [ Basic ]", () => {
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

  it("should refresh on tab focus", async () => {});
  it("should refresh on tab blur", async () => {});
});
