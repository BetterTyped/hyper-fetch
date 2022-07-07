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
      it("should trigger onCacheSuccess helper", async () => {
        // Todo
      });
      it("should trigger onCacheError helper", async () => {
        // Todo
      });
      it("should trigger onCacheUpdate helper", async () => {
        // Todo
      });
    });
    describe("when revalidate gets triggered", () => {
      it("should remove cached data", async () => {
        // Todo
      });
    });
  });
});
