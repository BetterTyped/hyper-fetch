import { startServer, resetInterceptors, stopServer } from "../../server";
import { builder } from "../../utils";

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
    await builder.clear();
  });

  it("should render fallback", async () => {
    // TODO
  });
  it("should render multiple fallbacks", async () => {
    // TODO
  });
  it("should throw errors", async () => {
    // TODO
  });
  it("should render cached data with error", async () => {
    // TODO
  });
});
