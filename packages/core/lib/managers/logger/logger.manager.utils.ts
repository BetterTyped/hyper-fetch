import { LoggerType } from "managers";

// Logger
export const logger: LoggerType = (log) => {
  const timestamp = new Date().toLocaleString();
  const module = `[${log.module}]:[${timestamp}]:`;
  // eslint-disable-next-line no-console
  console.log(`${module} ${log.message}`);
  log.additionalData?.forEach((data) => {
    // eslint-disable-next-line no-console
    console.log(module, data);
  });
};
