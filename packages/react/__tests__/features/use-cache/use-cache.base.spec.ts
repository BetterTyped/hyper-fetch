import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { builder, createCommand } from "../../utils";
import { renderUseCache } from "../../utils/use-cache.utils";

describe("useCache [ Base ]", () => {
  let command = createCommand();

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
    command = createCommand();
  });

  describe("given hook is mounting", () => {
    describe("when cache data read is pending", () => {
      it("should initialize with non-loading state", async () => {
        createRequestInterceptor(command);
        const { result } = renderUseCache(command);

        expect(result.current.loading).toBeFalse();
      });
    });
  });
  describe("given cache is empty", () => {
    describe("when reading the state", () => {
      it("should return empty state", async () => {
        // Todo
      });
    });
  });
  describe("given cache is present", () => {
    describe("when reading the state", () => {
      it("should return state", async () => {
        // Todo
      });
    });
  });
});
