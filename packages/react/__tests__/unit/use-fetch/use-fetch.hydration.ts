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
    it("should allow to prefetch before hydration", async () => {
      // TODO
    });
    it("should handle the successful response", async () => {
      // TODO
    });
    it("should handle the error response", async () => {
      // TODO
    });
    it("should handle the offline state", async () => {
      // TODO
    });
  });
});
