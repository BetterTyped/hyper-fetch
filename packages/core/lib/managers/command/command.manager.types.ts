export type CommandEventDetails = {
  requestId: string;
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
