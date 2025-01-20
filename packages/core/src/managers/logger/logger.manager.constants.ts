import { LogLevel } from "./logger.manager.types";

export const logLevelOrder: LogLevel[] = ["error", "warning", "info", "debug"];

const defaultStyles = "background:rgba(0,0,0,0.2);padding:2px 5px;border-radius:5px;font-weight:bold;";

export const loggerStyles: Record<LogLevel, string> = {
  error: `${defaultStyles}color:#db2525`,
  warning: `${defaultStyles}color:#e1941e`,
  info: `${defaultStyles}color:#1e74e1`,
  debug: `${defaultStyles}color:#adadad`,
};
