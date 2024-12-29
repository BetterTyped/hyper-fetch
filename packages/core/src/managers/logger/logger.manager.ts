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

  private client: Pick<ClientInstance, "debug">;

  constructor(private options?: LoggerOptionsType) {
    this.emitter?.setMaxListeners(1000);
    this.logger = this.options?.logger || logger;
    this.severity = this.options?.severity || 2;
  }

  setSeverity = (severity: SeverityType) => {
    this.severity = severity;
  };

  initialize = (client: Pick<ClientInstance, "debug">, module: string): LoggerType => {
    this.client = client;

    return {
      error: (message: LoggerMessageType, extra?: Record<string, unknown>) => {
        this.logger({
          level: "error",
          module,
          message,
          extra,
          severity: this.severity,
          enabled: this.client.debug,
        });
      },
      warning: (message: LoggerMessageType, extra?: Record<string, unknown>) => {
        this.logger({
          level: "warning",
          module,
          message,
          extra,
          severity: this.severity,
          enabled: this.client.debug,
        });
      },
      info: (message: LoggerMessageType, extra?: Record<string, unknown>) => {
        this.logger({
          level: "info",
          module,
          message,
          extra,
          severity: this.severity,
          enabled: this.client.debug,
        });
      },
      debug: (message: LoggerMessageType, extra?: Record<string, unknown>) => {
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
