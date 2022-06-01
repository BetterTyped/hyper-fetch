import { startServer, resetInterceptors, stopServer } from "../../server";

describe("useFetch [ Suspense ]", () => {
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

  it("should render fallback", async () => {});
  it("should render multiple fallbacks", async () => {});
  it("should work for non-promises", async () => {});
  it("should throw errors", async () => {});
  it("should render cached data with error", async () => {});
});
