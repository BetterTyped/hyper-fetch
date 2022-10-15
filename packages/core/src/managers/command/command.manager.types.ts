import { CommandInstance } from "command";

// Events
export type CommandLoadingEventType = {
  queueKey: string;
  requestId: string;
  loading: boolean;
  isRetry: boolean;
  isOffline: boolean;
};

export type CommandEventDetails<T extends CommandInstance> = {
  requestId: string;
  command: T;
};

export type CommandResponseDetails = {
  retries: number;
  timestamp: number;
  isFailed: boolean;
  isCanceled: boolean;
  isOffline: boolean;
};

export type CommandRemoveDetails = { queueKey: string; requestId: string };
