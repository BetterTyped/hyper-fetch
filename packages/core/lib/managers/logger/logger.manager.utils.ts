/* eslint-disable no-console */
import { loggerStyles, emojiLevel, LoggerType } from "managers";

const getTime = () => {
  const d = new Date();

  return `${d.toLocaleTimeString()}(:${d.getMilliseconds()})`;
};

// Logger
export const logger: LoggerType = (log) => {
  const styles = loggerStyles[log.level];
  const emoji = emojiLevel[log.level];
  const module = `%c[${emoji} ${log.module}]:[${getTime()}]:`;
  const message = `${module} ${log.message}`;
  console.log(message, styles);
  if (log.additionalData) {
    console.groupCollapsed(`${module}Details`, "font-weight: bold");
    log.additionalData.forEach((data) => {
      console.log(data);
    });
    console.groupEnd();
  }
};
