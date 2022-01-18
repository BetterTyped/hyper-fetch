import { LoggerLevelType } from "./logger.manager.types";

export const loggerColors: Record<LoggerLevelType, string> = {
  error: "red",
  warning: "orange",
  http: "black",
  info: "blue",
  debug: "gray",
};
