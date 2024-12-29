import { Client } from "client";
import { LoggerManager } from "managers";

describe("Logger [ Base ]", () => {
  let client = new Client({ url: "shared-base-url" });
  let loggerManager = new LoggerManager();

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    loggerManager = new LoggerManager();
  });

  describe("When using config methods", () => {
    it("should allow to initialize logger with module name", async () => {
      const logger = loggerManager.initialize(client, "Test Module");
      expect(logger).toBeDefined();
    });
  });
});
