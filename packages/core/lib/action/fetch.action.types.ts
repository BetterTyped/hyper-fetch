import { FetchCommand } from "command";
import { ClientQueryParamsType, ClientResponseErrorType, ClientResponseType, ClientResponseSuccessType } from "client";
import { FetchAction } from "action";

export type FetchActionLifecycle = "trigger" | "start" | "success" | "error" | "finished";

export type FetchActionInstance = FetchAction<any, any, any, any, any>;

export type FetchActionConfig<
  ResponseType,
  PayloadType,
  ErrorType,
  QueryParamsType extends ClientQueryParamsType | string,
  ClientOptions,
> = {
  name: string;
  on: {
    trigger?: (
      command: FetchCommand<ResponseType, PayloadType, QueryParamsType, ErrorType, string, ClientOptions>,
    ) => void;
    start?: (
      command: FetchCommand<ResponseType, PayloadType, QueryParamsType, ErrorType, string, ClientOptions>,
    ) => void;
    success?: (
      response: ClientResponseSuccessType<ResponseType>,
      command: FetchCommand<ResponseType, PayloadType, QueryParamsType, ErrorType, string, ClientOptions>,
    ) => void;
    error?: (
      response: ClientResponseErrorType<ErrorType>,
      command: FetchCommand<ResponseType, PayloadType, QueryParamsType, ErrorType, string, ClientOptions>,
    ) => void;
    finished?: (
      response: ClientResponseType<ResponseType, ErrorType>,
      command: FetchCommand<ResponseType, PayloadType, QueryParamsType, ErrorType, string, ClientOptions>,
    ) => void;
  };
};
