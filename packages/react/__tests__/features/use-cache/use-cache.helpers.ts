import { createHttpMockingServer } from "@hyper-fetch/testing";

const { resetMocks, startServer, stopServer } = createHttpMockingServer();

describe("useCache [ Helpers ]", () => {
  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetMocks();
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
    describe("when invalidate gets triggered", () => {
      it("should remove cached data", async () => {
        // Todo
      });
    });
  });
});
