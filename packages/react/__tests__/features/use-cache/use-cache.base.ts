import { startServer, resetInterceptors, stopServer } from "../../server";

describe("useCache [ Base ]", () => {
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

  describe("given hook is mounting", () => {
    describe("when cache data read is pending", () => {
      it("should initialize with loading state", async () => {});
    });
  });
  describe("given cache is empty", () => {
    describe("when reading the state", () => {
      it("should return empty state", async () => {});
    });
  });
});
