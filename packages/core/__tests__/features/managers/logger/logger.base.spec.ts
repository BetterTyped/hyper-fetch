import { Client } from "client";
import { LoggerManager } from "managers";

describe("Logger [ Base ]", () => {
  let client = new Client({ url: "shared-base-url" }).setDebug(true);
  let loggerManager = new LoggerManager();
  let mockLogger: jest.Mock;

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" }).setDebug(true);
    loggerManager = new LoggerManager();
    mockLogger = jest.fn();
    loggerManager.logger = mockLogger;
  });

  describe("When using config methods", () => {
    it("should allow to initialize logger with module name", async () => {
      const logger = loggerManager.initialize(client, "Test Module");
      expect(logger).toBeDefined();
    });

    it("should allow to set severity level", () => {
      loggerManager.setSeverity("error");
      expect(loggerManager.level).toBe("error");
    });

    it("should allow to set modules", () => {
      const modules = ["Module1", "Module2"];
      loggerManager.setModules(modules);
      expect(loggerManager.modules).toEqual(modules);
    });

    it("should allow to clear modules by passing undefined", () => {
      const modules = ["Module1", "Module2"];
      loggerManager.setModules(modules);
      loggerManager.setModules(undefined);
      expect(loggerManager.modules).toBeUndefined();
    });
  });

  describe("When filtering logs", () => {
    it("should log if message level is higher than manager level", () => {
      loggerManager.setSeverity("info");
      const logData = { level: "error", type: "system", module: "Test", title: "Test", extra: {} } as const;

      loggerManager.logger(logData);

      expect(mockLogger).toHaveBeenCalledWith(logData);
    });

    it("should log if message level equals manager level", () => {
      loggerManager.setSeverity("error");
      const logData = { level: "error", type: "system", module: "Test", title: "Test", extra: {} } as const;

      loggerManager.logger(logData);

      expect(mockLogger).toHaveBeenCalledWith(logData);
    });

    it("should not log if message level is lower than manager level", () => {
      loggerManager.setSeverity("error");
      const logger = loggerManager.initialize(client, "Test Module");

      logger.info({ type: "system", title: "Test", extra: {} });

      expect(mockLogger).not.toHaveBeenCalled();
    });

    it("should not log if module is not in allowed modules", () => {
      loggerManager.setModules(["Module1"]);
      const logger = loggerManager.initialize(client, "Test Module");

      logger.info({ type: "system", title: "Test", extra: {} });

      expect(mockLogger).not.toHaveBeenCalled();
    });

    it("should log if module is in allowed modules", () => {
      loggerManager.setModules(["Module1"]);
      const logger = loggerManager.initialize(client, "Module1");
      const logData = { level: "error", type: "system", module: "Module1", title: "Test", extra: {} } as const;

      logger.error(logData);

      expect(mockLogger).toHaveBeenCalledWith(logData);
    });

    it("should not log if module is in allowed modules", () => {
      loggerManager.setModules(["Module1"]);
      const logger = loggerManager.initialize(client, "Module2");
      const logData = { level: "error", type: "system", module: "Module2", title: "Test", extra: {} } as const;

      logger.error(logData);

      expect(mockLogger).not.toHaveBeenCalled();
    });

    it("should log all modules if no modules filter is set", () => {
      const logger = loggerManager.initialize(client, "Test Module");
      const logData = { level: "error", type: "system", module: "Test Module", title: "Test", extra: {} } as const;

      logger.error(logData);

      expect(mockLogger).toHaveBeenCalledWith(logData);
    });
  });
});
