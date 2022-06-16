import { BuilderInstance } from "builder";
import { LoggerLevelType, LoggerMessageType, LoggerOptionsType, LoggerType, logger, LoggerMethodsType } from "managers";

/**
 * This class is used across the Hyper Fetch library to provide unified logging system with necessary setup per each builder.
 * We can set up the logging level based on available values. This manager enable to initialize the logging instance per individual module
 * like Builder, Command etc. Which can give you better feedback on the logging itself.
 */
export class LoggerManager {
  logger: LoggerType;
  levels: LoggerLevelType[];

  constructor(private builder: BuilderInstance, private options?: LoggerOptionsType) {
    this.logger = this.options?.logger || logger;
    this.levels = this.options?.levels || ["error", "success", "warning", "http", "info"];
  }

  setLevels = (levels: LoggerLevelType[]) => {
    this.levels = levels;
  };

  init = (module: string): LoggerMethodsType => {
    return {
      success: (message: LoggerMessageType, ...additionalData: LoggerMessageType[]) => {
        if (!this.builder.debug || !this.levels.includes("success")) return;

        this.logger({ level: "success", module, message, additionalData });
      },
      error: (message: LoggerMessageType, ...additionalData: LoggerMessageType[]) => {
        if (!this.builder.debug || !this.levels.includes("error")) return;

        this.logger({ level: "error", module, message, additionalData });
      },
      warning: (message: LoggerMessageType, ...additionalData: LoggerMessageType[]) => {
        if (!this.builder.debug || !this.levels.includes("warning")) return;

        this.logger({ level: "warning", module, message, additionalData });
      },
      http: (message: LoggerMessageType, ...additionalData: LoggerMessageType[]) => {
        if (!this.builder.debug || !this.levels.includes("http")) return;

        this.logger({ level: "http", module, message, additionalData });
      },
      info: (message: LoggerMessageType, ...additionalData: LoggerMessageType[]) => {
        if (!this.builder.debug || !this.levels.includes("info")) return;

        this.logger({ level: "info", module, message, additionalData });
      },
      debug: (message: LoggerMessageType, ...additionalData: LoggerMessageType[]) => {
        if (!this.builder.debug || !this.levels.includes("debug")) return;

        this.logger({ level: "debug", module, message, additionalData });
      },
    };
  };
}
