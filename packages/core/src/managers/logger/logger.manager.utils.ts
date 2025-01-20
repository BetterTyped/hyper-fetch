/* eslint-disable no-console */
import { loggerColors, loggerStyles, LoggerType } from "managers";

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
  const color = loggerColors[log.level];
  const message = `%c[${getTime()}]%c${log.title}%c${getModuleName(log)}`;

  const style1 = `${styles}${color}font-weight:600;border-radius: 4px 0 0 4px;`;
  const style2 = `${styles}${color}font-weight:600;`;
  const style3 = `${styles}font-weight:normal;border-radius: 0 4px 4px 0;`;

  if (log.extra ? Object.keys(log.extra)?.length : false) {
    console.groupCollapsed(message, style1, style2, style3);
    console.log(log.extra);
    console.groupEnd();
  } else {
    console.log(message, styles);
  }
};
