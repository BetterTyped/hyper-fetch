import { LogLevel } from "./logger.manager.types";

export const logLevelOrder: LogLevel[] = ["error", "warning", "info", "debug"];

const defaultStyles = "padding:2px 5px;";

export const loggerStyles: Record<LogLevel, string> = {
  error: `${defaultStyles};background:#db252520;`,
  warning: `${defaultStyles};background:#e1941e20;`,
  info: `${defaultStyles};background:#1e74e120;`,
  debug: `${defaultStyles};background:#00000020;`,
};

export const loggerColors: Record<LogLevel, string> = {
  error: "color:#ff3737;",
  warning: "color:#ffc107;",
  info: "color:#34a8ff;",
  debug: "color:#cccccc;",
};
