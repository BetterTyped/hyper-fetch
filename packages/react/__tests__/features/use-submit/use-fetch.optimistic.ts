import { startServer, resetInterceptors, stopServer } from "../../server";
import { builder } from "../../utils";

describe("useFetch [ Optimistic Approach ]", () => {
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
    builder.clear();
  });

  describe("when request has been submitted", () => {
    it("should change cache data", async () => {
      // TODO
    });
    it("should allow to revert changes on error based on previous value", async () => {
      // TODO
    });
    it("should isolate contexts between different requests", async () => {
      // TODO
    });
    it("should allow to revalidate on finished query", async () => {
      // TODO
    });
  });
});
