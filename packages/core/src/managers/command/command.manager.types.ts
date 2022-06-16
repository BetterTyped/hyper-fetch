import { CommandInstance } from "command";

export type CommandEventDetails<T extends CommandInstance> = {
  requestId: string;
  command: T;
};

export type CommandResponseDetails = {
  retries: number;
  timestamp: Date;
  isFailed: boolean;
  isCanceled: boolean;
  isOffline: boolean;
};
