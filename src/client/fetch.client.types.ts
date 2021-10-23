import { FetchMiddleware } from "middleware/fetch.middleware";


export type FetchClientOptions = Parameters<typeof fetch>["1"];

export type ClientType<ErrorType, ClientOptions> = (middleware: FetchMiddleware<any, any, ErrorType, any, ClientOptions, any, any, any>) => Promise<ClientResponseType<any, any>>

export type ClientResponseType<GenericDataType, GenericErrorType> = [
  GenericDataType | null,
  GenericErrorType | null,
  number,
];