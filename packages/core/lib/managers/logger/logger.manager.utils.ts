import { LoggerType } from "managers";

export const getLoggerCaller = () => {
  try {
    throw new Error();
  } catch (e) {
    if (e instanceof Error && e.stack) {
      return e.stack.split("at ")[3].split(" ")[0] || "-";
    }
    return "-";
  }
};

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
