/* eslint-disable no-console */
import { loggerStyles, loggerIconLevels, LoggerType } from "managers";

const getTime = () => {
  const d = new Date();

  return `${d.toLocaleTimeString()}(:${d.getMilliseconds()})`;
};

// Logger
export const logger: LoggerType = (log) => {
  const styles = loggerStyles[log.level];
  const emoji = loggerIconLevels[log.level];
  const module = `%c[${log.module}]:[${getTime()}]:`;
  const message = `${emoji}${module} ${log.message}`;

  if (log.additionalData?.length) {
    console.groupCollapsed(message, styles);
    log.additionalData.forEach((data) => {
      console.log(data);
    });
    console.groupEnd();
  } else {
    console.log(message, styles);
  }
};
