/* eslint-disable no-console */
import { loggerStyles, loggerIconLevels, LoggerFunctionType, severity } from "managers";

export const getTime = () => {
  const d = new Date();
  return `${d.toLocaleTimeString()}(:${d.getMilliseconds()})`;
};

// Logger
export const logger: LoggerFunctionType = (log) => {
  if (log.enabled && log.severity >= severity[log.level]) {
    const styles = loggerStyles[log.level];
    const emoji = loggerIconLevels[log.level];
    const module = `%c[${emoji} ${log.module}]:[${getTime()}]:`;
    const message = `${module} ${log.message}`;

    if (log.extra?.length) {
      console.groupCollapsed(message, styles);
      console.log(log.extra);
      console.groupEnd();
    } else {
      console.log(message, styles);
    }
  }
};
