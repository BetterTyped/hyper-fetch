import {
  AdapterInstance,
  CacheValueType,
  ClientInstance,
  ExtendRequest,
  RequestEventType,
  RequestInstance,
  ResponseDetailsType,
  ResponseType,
} from "@hyper-fetch/core";

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

export type DevtoolsRequestEvent = Partial<DevtoolsRequestResponse> &
  RequestEvent<ClientInstance> & {
    isRemoved: boolean;
    isCanceled: boolean;
    isSuccess: boolean;
    isFinished: boolean;
    isPaused: boolean;
    triggerTimestamp: number;
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
