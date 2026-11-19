import { Client } from "client";
import type { LogLevel, LoggerArgs } from "managers";
import { logger as defaultLogger, LoggerManager, logLevelOrder } from "managers";

const levels: LogLevel[] = ["error", "warning", "info", "debug"];

describe("Logger [ Levels ]", () => {
  let output = vi.fn<(log: LoggerArgs) => void>();
  let debugClient = { debug: true };
  let manager = new LoggerManager({ logger: output });

  const logEveryLevel = (loggerManager: LoggerManager, module = "Module") => {
    const logger = loggerManager.initialize(debugClient, module);
    levels.forEach((level) => logger[level]({ title: level, type: "system", extra: {} }));
  };

  const getLoggedLevels = () => output.mock.calls.map(([log]) => log.level);

  beforeEach(() => {
    output = vi.fn<(log: LoggerArgs) => void>();
    debugClient = { debug: true };
    manager = new LoggerManager({ logger: output });
  });

  describe("When the level is set", () => {
    it.each([
      { level: "error" as const, expected: ["error"] },
      { level: "warning" as const, expected: ["error", "warning"] },
      { level: "info" as const, expected: ["error", "warning", "info"] },
      { level: "debug" as const, expected: ["error", "warning", "info", "debug"] },
    ])("should log the $level level and the more severe ones", ({ level, expected }) => {
      manager.setSeverity(level);

      logEveryLevel(manager);

      expect(getLoggedLevels()).toStrictEqual(expected);
    });

    it("should log the warnings and errors by default", () => {
      logEveryLevel(manager);

      expect(manager.level).toBe("warning");
      expect(getLoggedLevels()).toStrictEqual(["error", "warning"]);
    });

    it("should use the level passed in the options", () => {
      const debugManager = new LoggerManager({ logger: output, level: "debug" });

      logEveryLevel(debugManager);

      expect(getLoggedLevels()).toStrictEqual(levels);
    });

    it("should apply the level changed after the loggers were created", () => {
      const logger = manager.initialize(debugClient, "Module");

      logger.debug({ title: "hidden", type: "system", extra: {} });
      manager.setSeverity("debug");
      logger.debug({ title: "visible", type: "system", extra: {} });

      expect(output).toHaveBeenCalledTimes(1);
      expect(output.mock.calls[0][0].title).toBe("visible");
    });

    it("should order the levels from the most severe one", () => {
      expect(logLevelOrder).toStrictEqual(levels);
    });
  });

  describe("When the debug mode changes", () => {
    it("should not log anything without the debug mode", () => {
      debugClient.debug = false;
      manager.setSeverity("debug");

      logEveryLevel(manager);

      expect(output).not.toHaveBeenCalled();
    });

    it("should read the debug mode at the time of the log", () => {
      const logger = manager.initialize(debugClient, "Module");

      debugClient.debug = false;
      logger.error({ title: "hidden", type: "system", extra: {} });
      debugClient.debug = true;
      logger.error({ title: "visible", type: "system", extra: {} });

      expect(output).toHaveBeenCalledTimes(1);
      expect(output.mock.calls[0][0].title).toBe("visible");
    });

    it("should read the debug mode of the client which created the logger", () => {
      const silentLogger = manager.initialize({ debug: false }, "Silent");
      const loudLogger = manager.initialize({ debug: true }, "Loud");

      silentLogger.error({ title: "hidden", type: "system", extra: {} });
      loudLogger.error({ title: "visible", type: "system", extra: {} });

      expect(output.mock.calls.map(([log]) => log.module)).toStrictEqual(["Loud"]);
    });
  });

  describe("When the modules are filtered", () => {
    it("should log only the allowed modules", () => {
      manager.setModules(["Cache"]);

      logEveryLevel(manager, "Cache");
      logEveryLevel(manager, "Dispatcher");

      expect(output.mock.calls.every(([log]) => log.module === "Cache")).toBeTrue();
      expect(output).toHaveBeenCalledTimes(2);
    });

    it("should log nothing when the list of the modules is empty", () => {
      manager.setModules([]);

      logEveryLevel(manager, "Cache");

      expect(output).not.toHaveBeenCalled();
    });

    it("should log every module again when the filter is removed", () => {
      manager.setModules(["Cache"]);
      manager.setModules(undefined);

      logEveryLevel(manager, "Dispatcher");

      expect(output).toHaveBeenCalledTimes(2);
    });

    it("should use the modules passed in the options", () => {
      const filtered = new LoggerManager({ logger: output, modules: ["Cache"] });

      logEveryLevel(filtered, "Client");

      expect(output).not.toHaveBeenCalled();
    });
  });

  describe("When the log is passed to the output", () => {
    it("should add the level and the module to the log data", () => {
      const logger = manager.initialize(debugClient, "Module");
      const extra = { value: 1 };

      logger.error({ title: "Title", type: "system", extra });

      expect(output).toHaveBeenCalledWith({ title: "Title", type: "system", extra, level: "error", module: "Module" });
    });

    it("should print the logs with the default output", () => {
      const groupSpy = vi.spyOn(console, "groupCollapsed").mockImplementation(() => {});
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      vi.spyOn(console, "groupEnd").mockImplementation(() => {});
      const defaultManager = new LoggerManager({ level: "debug" });

      expect(defaultManager.logger).toBe(defaultLogger);
      logEveryLevel(defaultManager);

      expect(groupSpy.mock.calls.length + logSpy.mock.calls.length).toBe(levels.length);
      vi.restoreAllMocks();
    });

    it("should keep the loggers of different modules independent", () => {
      const cacheLogger = manager.initialize(debugClient, "Cache");
      const clientLogger = manager.initialize(debugClient, "Client");

      cacheLogger.error({ title: "first", type: "system", extra: {} });
      clientLogger.error({ title: "second", type: "system", extra: {} });

      expect(output.mock.calls.map(([log]) => log.module)).toStrictEqual(["Cache", "Client"]);
    });

    it("should use its own output when it is not the logger manager of the passed client", () => {
      const clientOutput = vi.fn();
      const client = new Client({ url: "shared-base-url" })
        .setDebug(true)
        .setLogger(() => new LoggerManager({ logger: clientOutput }));

      manager.initialize(client, "Module").error({ title: "Title", type: "system", extra: {} });

      expect(output).toHaveBeenCalledTimes(1);
      expect(clientOutput).not.toHaveBeenCalled();
      client.clear();
    });

    it("should not share the settings between the managers", () => {
      const otherOutput = vi.fn();
      const other = new LoggerManager({ logger: otherOutput });

      manager.setSeverity("debug");
      manager.setModules(["Cache"]);

      expect(other.level).toBe("warning");
      expect(other.modules).toBeUndefined();
      logEveryLevel(other);
      expect(otherOutput).toHaveBeenCalledTimes(2);
    });
  });
});
