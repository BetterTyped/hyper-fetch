import { createBuilder } from "../../../utils";
import { resetInterceptors, startServer, stopServer } from "../../../server";

describe("CommandManager [ Base ]", () => {
  const abortKey = "abort-key";
  const requestId = "some-id";
  let builder = createBuilder();

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    resetInterceptors();
    jest.resetAllMocks();
    builder = createBuilder();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When app manager is initialized", () => {
    it("should allow to add abort controller", async () => {
      expect(builder.commandManager.getAbortController(abortKey, requestId)).toBeUndefined();
      builder.commandManager.addAbortController(abortKey, requestId);
      expect(builder.commandManager.getAbortController(abortKey, requestId)).toBeDefined();
    });
    it("should allow to remove abort controller", async () => {
      builder.commandManager.addAbortController(abortKey, requestId);
      builder.commandManager.removeAbortController(abortKey, requestId);
      expect(builder.commandManager.getAbortController(abortKey, requestId)).toBeUndefined();
    });
    it("should not throw when removing non-existing controller", async () => {
      expect(() => builder.commandManager.removeAbortController(abortKey, requestId)).not.toThrow();
    });
  });
});
