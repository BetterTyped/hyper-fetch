import { AdapterInstance, ResponseType } from "adapter";
import { RequestInstance } from "request";

// Extra
export type LogLevel = "debug" | "info" | "warning" | "error";
export type LoggerOptionsType = { logger?: LoggerType; level?: LogLevel; modules?: string[] };

// Data
export type LogData<Data extends Record<string, any>> = {
  /** Some Message / https://google.com */
  title: string;
  /** Some contextual data */
  extra: Data;
};

// Logger

export type LoggerArgs = LogDataTypes & {
  /** "debug" | "info" | "warning" | "error" */
  level: LogLevel;
  /** Client / Request / Cache / Dispatcher / useFetch etc. */
  module: string;
};

export type LoggerType = (data: LoggerArgs) => void;

export type LoggerMethods = Record<LogLevel, (data: LogDataTypes) => void>;

// Events

export type LogRequestEventType = LogData<{ request: RequestInstance; [key: string]: unknown }>;
export type LogResponseEventType = LogData<{
  request: RequestInstance;
  response: ResponseType<any, any, AdapterInstance>;
  requestId: string;
  [key: string]: unknown;
}>;
export type LogSystemEventType = LogData<{ [key: string]: unknown }>;

export type LogDataTypes =
  | ({ type: "request" } & LogRequestEventType)
  | ({ type: "response" } & LogResponseEventType)
  | ({ type: "system" } & LogSystemEventType);
