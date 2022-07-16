import { ClientResponseType } from "client";
import { CommandInstance } from "command";
import { CommandResponseDetails } from "managers/command";

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

export type LoggerRequestEventData = { requestId: string; command: CommandInstance };
export type LoggerResponseEventData = {
  requestId: string;
  command: CommandInstance;
  response: ClientResponseType<unknown, unknown>;
  details: CommandResponseDetails;
};
