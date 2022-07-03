import { createBuilder, createCommand } from "../../utils";
import { resetInterceptors, startServer, stopServer } from "../../server";

describe("Command [ Cloning ]", () => {
  const endpoint = "/users/:userId";

  let builder = createBuilder();
  let command = createCommand(builder, { endpoint });
  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    builder = createBuilder();
    command = createCommand(builder, { endpoint });
    resetInterceptors();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When cloning command", () => {
    it("should generate new keys", async () => {
      const clone = command.setParams({ userId: 1 } as null).clone();
      expect(clone.abortKey).toBe(command.abortKey);
      expect(clone.queueKey).toBe(command.queueKey);
      expect(clone.cacheKey).not.toBe(command.cacheKey);
    });
    it("should not generate new keys when we set custom ones", async () => {
      const clone = command.setAbortKey("test").setCacheKey("test").setQueueKey("test").clone().clone();

      expect(clone.abortKey).toBe("test");
      expect(clone.queueKey).toBe("test");
      expect(clone.cacheKey).toBe("test");
    });
    it("should not generate new keys when we set custom ones", async () => {
      const clone = command.setAbortKey("test").setCacheKey("test").setQueueKey("test").clone().clone();

      expect(clone.abortKey).toBe("test");
      expect(clone.queueKey).toBe("test");
      expect(clone.cacheKey).toBe("test");
    });
  });
});
