import { startServer, resetInterceptors, stopServer } from "../../server";

describe("useFetch [ Revalidate ]", () => {
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

  it("should allow to revalidate on mount", async () => {});
  it("should allow to revalidate current hook", async () => {});
  it("should allow to revalidate hook by RegExp", async () => {});
  it("should allow to revalidate hook by key", async () => {});
});
