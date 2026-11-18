import type { ClientInstance } from "client";
import EventEmitter from "events";
import type { LogLevel, LoggerArgs, LoggerOptionsType, LoggerType, LoggerMethods } from "managers";
import { logger, logLevelOrder } from "managers";

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

    // Modules keep their logger methods for the whole lifetime. When they come from the logger manager of the client,
    // the logs have to follow the manager currently assigned to it - otherwise `client.setLogger()` would affect
    // only the modules initialized later.
    const getClientManager = () => (client as Partial<Pick<ClientInstance, "loggerManager">>).loggerManager;
    const isClientManager = getClientManager() === this;

    const log: LoggerType = (data) => {
      const clientManager = getClientManager();
      const manager = isClientManager && clientManager instanceof LoggerManager ? clientManager : this;
      manager.log(data, client);
    };

    return {
      error: (data) => log({ ...data, level: "error", module }),
      warning: (data) => log({ ...data, level: "warning", module }),
      info: (data) => log({ ...data, level: "info", module }),
      debug: (data) => log({ ...data, level: "debug", module }),
    };
  };

  private log = (data: LoggerArgs, client: Pick<ClientInstance, "debug"> = this.client) => {
    if (!client.debug) {
      return;
    }
    // Level is the least severe type of the logs to show - logs of this level and the more severe ones are printed
    if (logLevelOrder.indexOf(this.level) < logLevelOrder.indexOf(data.level)) {
      return;
    }
    if (this.modules && !this.modules.includes(data.module)) {
      return;
    }
    this.logger(data);
  };
}
