import { FetchMiddleware } from "middleware/middleware/fetch.middleware";

export type FetchClientOptions = XMLHttpRequest;

export type ClientType<ErrorType, ClientOptions> = (
  middleware: FetchMiddleware<any, any, ErrorType, any, ClientOptions, any, any, any>,
) => Promise<ClientResponseType<any, ErrorType>>;

export type ClientResponseType<GenericDataType, GenericErrorType> = [
  GenericDataType | null,
  GenericErrorType | null,
  number | null,
];

export type ClientResponseSuccessType<GenericDataType> = [GenericDataType, null, number | null];

export type ClientResponseErrorType<GenericErrorType> = [null, GenericErrorType, number | null];
