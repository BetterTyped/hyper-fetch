import { ResponseType } from "adapter";
import { RequestInstance } from "request";
import { ResponseDetailsType } from "managers/request";

// Logger
export type SeverityType = 0 | 1 | 2 | 3;
export type LoggerType = Record<
  LoggerLevelType,
  (message: LoggerMessageType, ...additionalData: LoggerMessageType[]) => void
>;
export type LoggerFunctionType = (log: LogType) => void;
export type LoggerOptionsType = { logger?: LoggerFunctionType; severity?: SeverityType };

// Log
export type LogType = {
  module: string;
  level: LoggerLevelType;
  message: LoggerMessageType;
  additionalData?: LoggerMessageType[];
  enabled: boolean;
  severity: SeverityType;
};

export type LoggerLevelType = "error" | "warning" | "info" | "debug";
export type LoggerMessageType = string | Record<string, unknown> | Array<unknown>;

// Events

export type LoggerRequestEventData = { requestId: string; request: RequestInstance };
export type LoggerResponseEventData = {
  requestId: string;
  request: RequestInstance;
  response: ResponseType<unknown, unknown, unknown>;
  details: ResponseDetailsType;
};
