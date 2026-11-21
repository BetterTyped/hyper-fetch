import type {
  AdapterInstance,
  CacheValueType,
  ClientInstance,
  ExtendRequest,
  RequestEventType,
  RequestInstance,
  RequestJSON,
  ResponseDetailsType,
  ResponseType,
} from "@hyper-fetch/core";

export type Sort = { key: string; order: "asc" | "desc" };

export type RequestEvent<T extends ClientInstance> = RequestEventType<
  ExtendRequest<
    RequestInstance,
    {
      client: T;
    }
  >
>;

export type DevtoolsElement = {
  requestId: string;
  cacheKey: string;
  queryKey: string;
  abortKey: string;
};

export type DevtoolsRequestResponse = {
  requestId: string;
  response: ResponseType<any, any, AdapterInstance>;
  details: ResponseDetailsType;
};

export type DevtoolsRequestEvent = Partial<Omit<DevtoolsRequestResponse, "requestId">> & {
  requestId: string;
  request: RequestJSON<RequestInstance>;
  client: ClientInstance;
  isRemoved: boolean;
  isCanceled: boolean;
  isSuccess: boolean;
  isFinished: boolean;
  isPaused: boolean;
  timestamp: number;
};

export type DevtoolsCacheEvent = {
  cacheKey: string;
  cacheData: CacheValueType<unknown, unknown, any>;
};

export type DevtoolsRequestQueueStats = {
  total: number;
  success: number;
  failed: number;
  canceled: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  lastTime: number;
  avgQueueTime: number;
  minQueueTime: number;
  maxQueueTime: number;
  lastQueueTime: number;
  avgProcessingTime: number;
  minProcessingTime: number;
  maxProcessingTime: number;
  lastProcessingTime: number;
};
