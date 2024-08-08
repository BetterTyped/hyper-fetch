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

export enum DevtoolsModule {
  NETWORK = "Network",
  CACHE = "Cache",
  LOGS = "Logs",
  PROCESSING = "Processing",
}

export type RequestEvent<T extends ClientInstance> = RequestEventType<
  ExtendRequest<
    RequestInstance,
    {
      client: T;
    }
  >
>;

export type RequestResponse<T extends ClientInstance> = {
  response: ResponseType<any, any, AdapterInstance>;
  details?: ResponseDetailsType;
} & RequestEvent<T>;

export type DevtoolsRequestEvent = RequestEvent<ClientInstance> &
  RequestResponse<ClientInstance> & {
    isRemoved: boolean;
    isCanceled: boolean;
    isSuccess: boolean;
    isFinished: boolean;
    isPaused: boolean;
    addedTimestamp: number;
  };

export type DevtoolsCacheEvent = {
  cacheKey: string;
  data: CacheValueType<unknown, unknown, any>;
};
