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
  // eslint-disable-next-line no-console
  console.log(log.message);
  // eslint-disable-next-line no-console
  console.table(log.additionalData);
};
