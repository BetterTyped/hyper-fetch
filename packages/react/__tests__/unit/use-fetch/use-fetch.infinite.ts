import { startServer, resetInterceptors, stopServer } from "../../server";
import { builder } from "../../utils";

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

  beforeEach(async () => {
    jest.resetModules();
    await builder.clear();
  });

  describe("when command query params are changed", () => {
    it("should allow to fetch paginated resource", async () => {});
    it("should allow to invalidate all pages", async () => {});
    it("should cache pages on remounting", async () => {});
    it("should automatically generate command cacheKey for paginated views", async () => {});
  });
});
