/* eslint-disable no-console */
import { loggerStyles, LoggerType } from "managers";

const getTime = () => {
  const d = new Date();

  return `${d.toLocaleTimeString()}(:${d.getMilliseconds()})`;
};

// Logger
export const logger: LoggerType = (log) => {
  const styles = loggerStyles[log.level];
  const module = `%c[${log.module}]:[${getTime()}]:`;
  console.log(module, styles, log.message);
  if (log.additionalData) {
    console.groupCollapsed(`${module}Details`);
    log.additionalData.forEach((data) => {
      console.log(data);
    });
    console.groupEnd();
  }
};
