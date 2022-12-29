import { startServer, resetInterceptors, stopServer } from "../../server";
import { client } from "../../utils";

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

  beforeEach(() => {
    jest.resetModules();
    client.clear();
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
