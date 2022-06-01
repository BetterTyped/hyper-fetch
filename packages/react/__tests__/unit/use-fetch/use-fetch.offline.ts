import { startServer, resetInterceptors, stopServer } from "../../server";

describe("useFetch [ Offline ]", () => {
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

  describe("when application is offline", () => {
    it("should not revalidate on offline", async () => {});
    it("should fetch when coming back online", async () => {});
    it("should revalidate on reconnect", async () => {});
  });
  describe("when command offline attribute is set to true", () => {
    it("should wait with request until getting back offline", async () => {});
    it("should not emit offline error until server error is returned", async () => {});
    it("should not emit offline error when getting offline during request", async () => {});
  });
});
