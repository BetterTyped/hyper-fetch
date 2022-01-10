import { FetchBuilderErrorType } from "builder";
import { FetchActionConfig } from "action";
import { FetchCommand } from "command";
import { ClientQueryParamsType, ClientResponseErrorType, ClientResponseType, ClientResponseSuccessType } from "client";

export class FetchAction<
  ResponseType,
  PayloadType = unknown,
  ErrorType extends FetchBuilderErrorType = Error,
  QueryParamsType extends ClientQueryParamsType = ClientQueryParamsType,
  ClientOptions = unknown,
> {
  constructor(public config: FetchActionConfig<ResponseType, PayloadType, ErrorType, QueryParamsType, ClientOptions>) {}

  getName = () => {
    return this.config.name;
  };

  onTrigger = (command: FetchCommand<ResponseType, PayloadType, QueryParamsType, ErrorType, string, ClientOptions>) => {
    this.config.on.trigger?.(command);
  };
  onStart = (command: FetchCommand<ResponseType, PayloadType, QueryParamsType, ErrorType, string, ClientOptions>) => {
    this.config.on.start?.(command);
  };
  onSuccess = (
    response: ClientResponseSuccessType<ResponseType>,
    command: FetchCommand<ResponseType, PayloadType, QueryParamsType, ErrorType, string, ClientOptions>,
  ) => {
    this.config.on.success?.(response, command);
  };
  onError = (
    response: ClientResponseErrorType<ErrorType>,
    command: FetchCommand<ResponseType, PayloadType, QueryParamsType, ErrorType, string, ClientOptions>,
  ) => {
    this.config.on.error?.(response, command);
  };
  onFinished = (
    response: ClientResponseType<ResponseType, ErrorType>,
    command: FetchCommand<ResponseType, PayloadType, QueryParamsType, ErrorType, string, ClientOptions>,
  ) => {
    this.config.on.finished?.(response, command);
  };
}
