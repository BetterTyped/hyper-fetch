// Logger
export type LoggerMethodsType = Record<
  LoggerLevelType,
  (message: LoggerMessageType, ...additionalData: LoggerMessageType[]) => void
>;
export type LoggerType = (log: LogType) => void;
export type LoggerOptionsType = { logger?: LoggerType; levels?: LoggerLevelType[] };

// Log
export type LogType = {
  module: string;
  level: LoggerLevelType;
  message: LoggerMessageType;
  additionalData?: LoggerMessageType[];
};

export type LoggerLevelType = "success" | "error" | "warning" | "http" | "info" | "debug";
export type LoggerMessageType = string | Record<string, unknown> | Array<unknown>;
