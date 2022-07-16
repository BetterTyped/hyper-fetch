import { LoggerManager } from "managers";

import { createBuilder } from "../../../utils";

describe("Logger [ Base ]", () => {
  let builder = createBuilder();
  let loggerManager = new LoggerManager(builder);

  beforeEach(() => {
    builder = createBuilder();
    loggerManager = new LoggerManager(builder);
  });

  describe("When using config methods", () => {
    it("should allow to initialize logger with module name", async () => {
      const logger = loggerManager.init("Test Module");
      expect(logger).toBeDefined();
    });
  });
});
