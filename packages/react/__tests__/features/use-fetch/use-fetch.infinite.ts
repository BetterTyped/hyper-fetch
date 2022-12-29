import { startServer, resetInterceptors, stopServer } from "../../server";
import { client } from "../../utils";

describe("useFetch [ Infinite ]", () => {
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

  describe("when request query params are changed", () => {
    it("should allow to cancel previous request on switching pages during requests", async () => {
      // TODO
    });
    it("should use cached pages on mounting", async () => {
      // TODO
    });
    it("should automatically generate request cacheKey for paginated views", async () => {
      // TODO
    });
    it("should not remove previous page data until current is fetched", async () => {
      // TODO
    });
  });
});
