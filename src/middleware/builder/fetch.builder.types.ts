import { ClientResponseType } from "client";
import { FetchMiddlewareInstance } from "../middleware/fetch.middleware.types";

export type FetchBuilderProps = {
  baseUrl: string;
  debug?: boolean;
};

export type ErrorMessageMapperCallback<ErrorType> = (error: any) => ErrorType;

// Interceptors
export type RequestInterceptorCallback = (middleware: FetchMiddlewareInstance) => FetchMiddlewareInstance;
export type ResponseInterceptorCallback = (
  middleware: FetchMiddlewareInstance,
  response: ClientResponseType<any, any>,
) => ClientResponseType<any, any>;
