import { Client } from "client";
import { LoggerManager } from "managers";

describe("Logger [ Base ]", () => {
  let client = new Client({ url: "shared-base-url" });
  let loggerManager = new LoggerManager(client);

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    loggerManager = new LoggerManager(client);
  });

  describe("When using config methods", () => {
    it("should allow to initialize logger with module name", async () => {
      const logger = loggerManager.init("Test Module");
      expect(logger).toBeDefined();
    });
  });
});
