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

  beforeEach(() => {
    jest.resetModules();
  });

  it("should allow to revalidate other command on finished", async () => {});
});
