import {
  ExtractClientOptions,
  FetchProgressType,
  FetchCommandInstance,
  QueueDumpValueType,
} from "@better-typed/hyper-fetch";

export type UseQueueOptions = {
  queueType?: "auto" | "fetch" | "submit";
};

export type QueueRequest<Command extends FetchCommandInstance> = QueueDumpValueType<
  ExtractClientOptions<Command>,
  Command
> & {
  uploading?: FetchProgressType;
  downloading?: FetchProgressType;
};
