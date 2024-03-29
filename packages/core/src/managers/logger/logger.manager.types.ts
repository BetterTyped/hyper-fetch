import { AdapterInstance, ResponseReturnType } from "adapter";
import { RequestInstance } from "request";
import { ResponseDetailsType } from "managers/request";

// Logger
export type SeverityType = 0 | 1 | 2 | 3;
export type LoggerType = Record<LoggerLevelType, (message: LoggerMessageType, ...extra: LoggerMessageType[]) => void>;
export type LoggerFunctionType = (log: LogType) => void;
export type LoggerOptionsType = { logger?: LoggerFunctionType; severity?: SeverityType };

// Log
export type LogType = {
  module: string;
  level: LoggerLevelType;
  message: LoggerMessageType;
  extra?: LoggerMessageType[];
  enabled: boolean;
  severity: SeverityType;
};

export type LoggerLevelType = "error" | "warning" | "info" | "debug";
export type LoggerMessageType = string | Record<string, unknown> | Array<unknown>;

// Events

export type LoggerRequestEventData = { requestId: string; request: RequestInstance };
export type LoggerResponseEventData<Adapter extends AdapterInstance> = {
  requestId: string;
  request: RequestInstance;
  response: ResponseReturnType<unknown, unknown, Adapter>;
  details: ResponseDetailsType;
};
