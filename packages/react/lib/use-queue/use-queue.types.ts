import { FetchProgressType, FetchCommandInstance, DispatcherDumpValueType } from "@better-typed/hyper-fetch";

export type UseQueueOptions = {
  queueType?: "auto" | "fetch" | "submit";
};

export type QueueRequest<Command extends FetchCommandInstance> = DispatcherDumpValueType<Command> & {
  uploading?: FetchProgressType;
  downloading?: FetchProgressType;
  startRequest: () => void;
  stopRequest: () => void;
  deleteRequest: () => void;
};

export type UseQueueReturnType<T extends FetchCommandInstance> = {
  stopped: boolean;
  requests: QueueRequest<T>[];
  stop: () => void;
  pause: () => void;
  start: () => void;
};
