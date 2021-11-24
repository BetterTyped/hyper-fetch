import { ClientResponseType, ClientType } from "client";
import { FetchMiddlewareInstance } from "../middleware/fetch.middleware.types";

export type FetchBuilderProps<ClientOptions> = {
  baseUrl: string;
  debug?: boolean;
  options?: ClientOptions;
};

export type FetchBuilderConfig<ErrorType, ClientOptions> = {
  baseUrl: string;
  debug: boolean;
  options: ClientOptions | undefined;
  client: ClientType<ErrorType, ClientOptions>;
  onErrorCallback: ErrorMessageMapperCallback<ErrorType> | undefined;
  onRequestCallbacks: (middleware: FetchMiddlewareInstance) => Promise<FetchMiddlewareInstance>;
  onResponseCallbacks: (
    middleware: FetchMiddlewareInstance,
    response: ClientResponseType<any, ErrorType>,
  ) => Promise<ClientResponseType<any, ErrorType>>;
};

// Interceptors
export type ErrorMessageMapperCallback<ErrorType> = (error: any) => ErrorType;
export type RequestInterceptorCallback = (middleware: FetchMiddlewareInstance) => FetchMiddlewareInstance;
export type ResponseInterceptorCallback = (
  middleware: FetchMiddlewareInstance,
  response: ClientResponseType<any, any>,
) => ClientResponseType<any, any>;
