import { FetchCommandInstance } from "command";

export type CommandEventDetails<T extends FetchCommandInstance> = {
  requestId: string;
  command: T;
};

export type CommandResponseDetails = {
  retries: number;
  timestamp: Date;
  isFailed: boolean;
  isCanceled: boolean;
  isRefreshed: boolean;
  isOffline: boolean;
  isStopped: boolean;
};
