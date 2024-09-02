import { QueueDataType, RequestInstance } from "@hyper-fetch/core";

import {
  DevtoolsCacheEvent,
  DevtoolsElement,
  DevtoolsRequestEvent,
  DevtoolsRequestQueueStats,
  DevtoolsRequestResponse,
} from "./message.parts";

export type MessageType = {
  data: {
    requestsMap: RequestInstance[];
    requests: DevtoolsRequestEvent[];
    failed: DevtoolsRequestResponse[];
    success: DevtoolsRequestResponse[];
    inProgress: DevtoolsElement[];
    paused: DevtoolsElement[];
    canceled: DevtoolsElement[];
    removed: DevtoolsElement[];
    queues: QueueDataType[];
    stats: Record<string, DevtoolsRequestQueueStats>;
    cache: DevtoolsCacheEvent[];
  };
};
