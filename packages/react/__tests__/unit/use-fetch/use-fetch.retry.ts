import { startServer, resetInterceptors, stopServer } from "../../server";
import { builder } from "../../utils";

describe("useFetch [ Retry ]", () => {
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

  describe("when command retry attribute is set to false", () => {
    it("should not retry request on failure", async () => {});
  });
  describe("when command retry attribute is set to true", () => {
    it("should retry request once", async () => {});
    it("should retry request twice", async () => {});
    it("should trigger retries with the config interval", async () => {});
  });
});
