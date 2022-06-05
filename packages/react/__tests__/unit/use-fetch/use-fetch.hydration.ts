import { startServer, resetInterceptors, stopServer } from "../../server";
import { builder } from "../../utils";

describe("useFetch [ Hydration ]", () => {
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

  describe("when environment is server side rendered", () => {
    it("should allow to prefetch before hydration", async () => {});
    it("should handle the successful response", async () => {});
    it("should handle the error response", async () => {});
    it("should handle the offline state", async () => {});
  });
});
