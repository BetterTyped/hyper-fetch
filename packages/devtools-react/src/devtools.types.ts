import {
  AdapterInstance,
  ClientInstance,
  ExtendRequest,
  ExtractClientAdapterType,
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
      adapter: ExtractClientAdapterType<T>;
    }
  >
>;

export type RequestResponse<T extends ClientInstance> = {
  response: ResponseType<any, any, AdapterInstance>;
  details: ResponseDetailsType;
} & RequestEvent<T>;
