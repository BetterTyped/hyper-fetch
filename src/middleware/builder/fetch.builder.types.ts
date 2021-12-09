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
  onRequestCallbacks: RequestInterceptorCallback;
  onResponseCallbacks: ResponseInterceptorCallback;
};

// Interceptors
export type ErrorMessageMapperCallback<ErrorType> = (error: any) => Promise<ErrorType> | ErrorType;
export type RequestInterceptorCallback = (
  middleware: FetchMiddlewareInstance,
) => Promise<FetchMiddlewareInstance> | FetchMiddlewareInstance;
export type ResponseInterceptorCallback = (
  response: ClientResponseType<any, any>,
  middleware: FetchMiddlewareInstance,
) => Promise<ClientResponseType<any, any>> | ClientResponseType<any, any>;
