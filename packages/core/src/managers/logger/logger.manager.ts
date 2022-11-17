import EventEmitter from "events";

import { BuilderInstance } from "builder";
import { logger, LoggerType, SeverityType, LoggerMessageType, LoggerOptionsType, LoggerFunctionType } from "managers";

/**
 * This class is used across the Hyper Fetch library to provide unified logging system with necessary setup per each builder.
 * We can set up the logging level based on available values. This manager enable to initialize the logging instance per individual module
 * like Builder, Command etc. Which can give you better feedback on the logging itself.
 */
export class LoggerManager {
  logger: LoggerFunctionType;
  severity: SeverityType;

  public emitter = new EventEmitter();

  constructor(private builder: Pick<BuilderInstance, "debug">, private options?: LoggerOptionsType) {
    this.logger = this.options?.logger || logger;
    this.severity = this.options?.severity || 2;
  }

  setSeverity = (severity: SeverityType) => {
    this.severity = severity;
  };

  init = (module: string): LoggerType => {
    return {
      error: (message: LoggerMessageType, ...additionalData: LoggerMessageType[]) => {
        this.logger({
          level: "error",
          module,
          message,
          additionalData,
          severity: this.severity,
          enabled: this.builder.debug,
        });
      },
      warning: (message: LoggerMessageType, ...additionalData: LoggerMessageType[]) => {
        this.logger({
          level: "warning",
          module,
          message,
          additionalData,
          severity: this.severity,
          enabled: this.builder.debug,
        });
      },
      info: (message: LoggerMessageType, ...additionalData: LoggerMessageType[]) => {
        this.logger({
          level: "info",
          module,
          message,
          additionalData,
          severity: this.severity,
          enabled: this.builder.debug,
        });
      },
      debug: (message: LoggerMessageType, ...additionalData: LoggerMessageType[]) => {
        this.logger({
          level: "debug",
          module,
          message,
          additionalData,
          severity: this.severity,
          enabled: this.builder.debug,
        });
      },
    };
  };
}
