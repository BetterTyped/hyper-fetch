import { CommandInstance } from "command";

// Events
export type CommandLoadingEventType = {
  isLoading: boolean;
  isRetry: boolean;
  isOffline: boolean;
};

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
