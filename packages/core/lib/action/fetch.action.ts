import { FetchActionConfig } from "action";
import { ExtractError, ExtractRequestError } from "types";
import { ClientResponseErrorType, ClientResponseType, ClientResponseSuccessType } from "client";
import { FetchCommandInstance } from "command";

export class FetchAction<T extends FetchCommandInstance> {
  constructor(public config: FetchActionConfig<T>) {}

  getName = () => {
    return this.config.name;
  };

  onTrigger = (command: T) => {
    this.config.on.trigger?.(command);
  };
  onStart = (command: T) => {
    this.config.on.start?.(command);
  };
  onSuccess = (response: ClientResponseSuccessType<ResponseType>, command: T) => {
    this.config.on.success?.(response, command);
  };
  onError = (response: ClientResponseErrorType<ExtractError<T> | ExtractRequestError<T>>, command: T) => {
    this.config.on.error?.(response, command);
  };
  onFinished = (response: ClientResponseType<ResponseType, ExtractError<T> | ExtractRequestError<T>>, command: T) => {
    this.config.on.finished?.(response, command);
  };
}
