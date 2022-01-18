import { loggerStyles, LoggerType } from "managers";

// Logger
export const logger: LoggerType = (log) => {
  const styles = loggerStyles[log.level];
  const timestamp = new Date().toLocaleString();
  const module = `%c[${log.module}]:[${timestamp}]:`;
  // eslint-disable-next-line no-console
  console.log(module, styles, log.message);
  log.additionalData?.forEach((data) => {
    // eslint-disable-next-line no-console
    console.log(module, styles, data);
  });
};
