import { FetchProgressType, CommandInstance, DispatcherDumpValueType } from "@better-typed/hyper-fetch";

export type UseQueueOptionsType = {
  queueType?: "auto" | "fetch" | "submit";
};

export type QueueRequest<Command extends CommandInstance> = DispatcherDumpValueType<Command> & {
  uploading?: FetchProgressType;
  downloading?: FetchProgressType;
  startRequest: () => void;
  stopRequest: () => void;
  deleteRequest: () => void;
};

export type UseQueueReturnType<T extends CommandInstance> = {
  stopped: boolean;
  requests: QueueRequest<T>[];
  stop: () => void;
  pause: () => void;
  start: () => void;
};
