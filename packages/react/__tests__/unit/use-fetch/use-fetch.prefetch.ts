import { startServer, resetInterceptors, stopServer } from "../../server";
import { builder } from "../../utils";

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
    await builder.clear();
  });

  describe("when command is triggered while mounting page", () => {
    it("should pre-fetch data", async () => {});
    it("should not show error when pre-fetching is failed", async () => {});
  });
});
