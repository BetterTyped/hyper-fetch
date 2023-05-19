import EventEmitter from "events";

import { ClientInstance } from "client";
import { logger, LoggerType, SeverityType, LoggerMessageType, LoggerOptionsType, LoggerFunctionType } from "managers";

/**
 * This class is used across the Hyper Fetch library to provide unified logging system with necessary setup per each client.
 * We can set up the logging level based on available values. This manager enable to initialize the logging instance per individual module
 * like Client, Request etc. Which can give you better feedback on the logging itself.
 */
export class LoggerManager {
  logger: LoggerFunctionType;
  severity: SeverityType;

  public emitter = new EventEmitter();

  constructor(private client: Pick<ClientInstance, "debug">, private options?: LoggerOptionsType) {
    this.logger = this.options?.logger || logger;
    this.severity = this.options?.severity || 2;
  }

  setSeverity = (severity: SeverityType) => {
    this.severity = severity;
  };

  init = (module: string): LoggerType => {
    return {
      error: (message: LoggerMessageType, ...extra: LoggerMessageType[]) => {
        this.logger({
          level: "error",
          module,
          message,
          extra,
          severity: this.severity,
          enabled: this.client.debug,
        });
      },
      warning: (message: LoggerMessageType, ...extra: LoggerMessageType[]) => {
        this.logger({
          level: "warning",
          module,
          message,
          extra,
          severity: this.severity,
          enabled: this.client.debug,
        });
      },
      info: (message: LoggerMessageType, ...extra: LoggerMessageType[]) => {
        this.logger({
          level: "info",
          module,
          message,
          extra,
          severity: this.severity,
          enabled: this.client.debug,
        });
      },
      debug: (message: LoggerMessageType, ...extra: LoggerMessageType[]) => {
        this.logger({
          level: "debug",
          module,
          message,
          extra,
          severity: this.severity,
          enabled: this.client.debug,
        });
      },
    };
  };
}
