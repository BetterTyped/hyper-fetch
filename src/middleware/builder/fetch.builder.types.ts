import { ClientResponseType } from "client";
import { FetchMiddlewareInstance } from "../middleware/fetch.middleware.types";

export type ErrorMessageMapperCallback<ErrorType> = (errorResponse: ErrorType) => string;
export type RequestInterceptorCallback = (middleware: FetchMiddlewareInstance) => FetchMiddlewareInstance;
export type ResponseInterceptorCallback = (
  response: ClientResponseType<any, any>,
  middleware: FetchMiddlewareInstance,
) => ClientResponseType<any, any>;

export type FetchBuilderProps = {
  baseUrl: string;
  debug?: boolean;
};
