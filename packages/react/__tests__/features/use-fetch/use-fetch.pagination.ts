import { startServer, resetInterceptors, stopServer } from "../../server";
import { client } from "../../utils";

describe("useFetch [ Pagination ]", () => {
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
    client.clear();
  });

  describe("when request query params are changed", () => {
    it("should allow to see previous results until new page is loaded", async () => {
      // TODO
    });
    it("should not override previous results by initialData", async () => {
      // TODO
    });
    it("should cache pages on change", async () => {
      // TODO
    });
  });
});
