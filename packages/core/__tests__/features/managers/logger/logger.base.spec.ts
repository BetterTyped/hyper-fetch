import { LoggerManager } from "managers";
import { createClient } from "../../../utils";

describe("Logger [ Base ]", () => {
  let client = createClient();
  let loggerManager = new LoggerManager(client);

  beforeEach(() => {
    client = createClient();
    loggerManager = new LoggerManager(client);
  });

  describe("When using config methods", () => {
    it("should allow to initialize logger with module name", async () => {
      const logger = loggerManager.init("Test Module");
      expect(logger).toBeDefined();
    });
  });
});
