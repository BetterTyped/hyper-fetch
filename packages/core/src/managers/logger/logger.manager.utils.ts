/* eslint-disable no-console */
import { loggerStyles, LoggerType } from "managers";

export const getTime = () => {
  const d = new Date();
  return `${d.toLocaleTimeString()}`;
};

const getModuleName = (data: Parameters<LoggerType>[0]) => {
  if (data.type === "request" || data.type === "response") {
    return `${data.extra.request.endpoint}`;
  }
  return `[${data.module}]`;
};

// Logger
export const logger: LoggerType = (log) => {
  const styles = loggerStyles[log.level];
  const module = `%c[${getTime()}] ${getModuleName(log)}`;
  const message = `${module} | ${log.title}`;

  if (log.extra ? Object.keys(log.extra)?.length : false) {
    console.groupCollapsed(message, styles);
    console.log(log.extra);
    console.groupEnd();
  } else {
    console.log(message, styles);
  }
};
