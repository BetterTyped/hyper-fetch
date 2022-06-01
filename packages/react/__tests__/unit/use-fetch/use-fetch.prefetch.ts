import { startServer, resetInterceptors, stopServer } from "../../server";

describe("useFetch [ Prefetch ]", () => {
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

  describe("when command is triggered while mounting page", () => {
    it("should pre-fetch data", async () => {});
    it("should not show error when pre-fetching is failed", async () => {});
  });
});
