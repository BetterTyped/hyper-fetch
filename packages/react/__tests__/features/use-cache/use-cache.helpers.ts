import { startServer, resetInterceptors, stopServer } from "../../server";

describe("useCache [ Helpers ]", () => {
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

  describe("given hook is mounted", () => {
    describe("when getting the response", () => {
      it("should trigger onCacheSuccess helper", async () => {});
      it("should trigger onCacheError helper", async () => {});
      it("should trigger onCacheUpdate helper", async () => {});
    });
    describe("when revalidate gets triggered", () => {
      it("should remove cached data", async () => {});
    });
  });
});
