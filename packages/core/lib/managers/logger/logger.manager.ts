import { LoggerLevelType, LoggerMessageType, LoggerOptionsType, LoggerType, logger, LoggerMethodsType } from "managers";
import { FetchBuilderInstance } from "builder";

export class LoggerManager {
  logger: LoggerType;
  levels: LoggerLevelType[];

  constructor(private builder: FetchBuilderInstance, private options?: LoggerOptionsType) {
    this.logger = this.options?.logger || logger;
    this.levels = this.options?.levels || ["error", "warning", "http", "http", "info", "debug"];
  }

  setLevels = (levels: LoggerLevelType[]) => {
    this.levels = levels;
  };

  init = (module: string): LoggerMethodsType => {
    return {
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
