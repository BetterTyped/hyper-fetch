import EventEmitter from "events";

import type { ClientInstance } from "client";
import { logger, LogLevel, LoggerOptionsType, logLevelOrder, LoggerType, LoggerMethods } from "managers";

/**
 * This class is used across the Hyper Fetch library to provide unified logging system with necessary setup per each client.
 * We can set up the logging level based on available values. This manager enable to initialize the logging instance per individual module
 * like Client, Request etc. Which can give you better feedback on the logging itself.
 */
export class LoggerManager {
  logger: LoggerType;
  level: LogLevel;
  modules: string[] | undefined;

  public emitter = new EventEmitter();

  private client: Pick<ClientInstance, "debug">;

  constructor(private options?: LoggerOptionsType) {
    this.emitter?.setMaxListeners(1000);
    this.logger = this.options?.logger || logger;
    this.level = this.options?.level || "warning";
    this.modules = this.options?.modules;
  }

  setSeverity = (level: LogLevel) => {
    this.level = level;
  };

  setModules = (modules: string[] | undefined) => {
    this.modules = modules;
  };

  initialize = (client: Pick<ClientInstance, "debug">, module: string): LoggerMethods => {
    this.client = client;

    return {
      error: (data) => this.log({ ...data, level: "error", module }),
      warning: (data) => this.log({ ...data, level: "warning", module }),
      info: (data) => this.log({ ...data, level: "info", module }),
      debug: (data) => this.log({ ...data, level: "debug", module }),
    };
  };

  private log: LoggerType = (data) => {
    if (!this.client.debug) {
      return;
    }
    if (logLevelOrder.indexOf(this.level) <= logLevelOrder.indexOf(data.level)) {
      return;
    }
    if (this.modules && !this.modules.includes(data.module)) {
      return;
    }
    this.logger(data);
  };
}
