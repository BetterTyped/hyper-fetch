import { LoggerLevelType } from "./logger.manager.types";

const defaultStyles = "background:rgba(0,0,0,0.2);padding:2px 5px;border-radius:5px;font-weight:bold;";

export const loggerStyles: Record<LoggerLevelType, string> = {
  error: `${defaultStyles}color:#db2525`,
  warning: `${defaultStyles}color:#e1941e`,
  http: `${defaultStyles}color:#c743cf`,
  info: `${defaultStyles}color:#1e74e1`,
  debug: `${defaultStyles}color:#adadad`,
};

export const emojiLevel: Record<LoggerLevelType, string> = {
  error: `🚨`,
  warning: `🚧`,
  http: `🚀`,
  info: `ℹ️`,
  debug: `🛩️`,
};
