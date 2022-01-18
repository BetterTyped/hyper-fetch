import { LoggerLevelType, LoggerMessageType, LoggerOptionsType, LoggerType, logger } from "managers";
import { FetchBuilderInstance } from "builder";

export class Logger {
  logger: LoggerType;
  levels: LoggerLevelType[];

  constructor(private builder: FetchBuilderInstance, private options?: LoggerOptionsType) {
    this.logger = this.options?.logger || logger;
    this.levels = this.options?.levels || ["error", "warning", "http", "http", "info", "debug"];
  }

  error = (module: string, message: LoggerMessageType, ...additionalData: LoggerMessageType[]) => {
    if (!this.builder.debug || !this.levels.includes("error")) return;

    this.logger({ level: "error", module, message, additionalData });
  };

  warning = (module: string, message: LoggerMessageType, ...additionalData: LoggerMessageType[]) => {
    if (!this.builder.debug || !this.levels.includes("warning")) return;

    this.logger({ level: "warning", module, message, additionalData });
  };

  http = (module: string, message: LoggerMessageType, ...additionalData: LoggerMessageType[]) => {
    if (!this.builder.debug || !this.levels.includes("http")) return;

    this.logger({ level: "http", module, message, additionalData });
  };

  info = (module: string, message: LoggerMessageType, ...additionalData: LoggerMessageType[]) => {
    if (!this.builder.debug || !this.levels.includes("info")) return;

    this.logger({ level: "info", module, message, additionalData });
  };

  debug = (module: string, message: LoggerMessageType, ...additionalData: LoggerMessageType[]) => {
    if (!this.builder.debug || !this.levels.includes("debug")) return;

    this.logger({ level: "debug", module, message, additionalData });
  };
}
