import { FetchEffectConfig } from "effect";
import { ExtractError, ExtractLocalError } from "types";
import { ClientResponseErrorType, ClientResponseType, ClientResponseSuccessType } from "client";
import { FetchCommandInstance } from "command";

export class FetchEffect<T extends FetchCommandInstance> {
  constructor(public config: FetchEffectConfig<T>) {}

  getEffectKey = () => {
    return this.config.effectKey;
  };

  onTrigger = (command: T) => {
    this.config.onTrigger?.(command);
  };
  onStart = (command: T) => {
    this.config.onStart?.(command);
  };
  onSuccess = (response: ClientResponseSuccessType<ResponseType>, command: T) => {
    this.config.onSuccess?.(response, command);
  };
  onError = (response: ClientResponseErrorType<ExtractError<T> | ExtractLocalError<T>>, command: T) => {
    this.config.onError?.(response, command);
  };
  onFinished = (response: ClientResponseType<ResponseType, ExtractError<T> | ExtractLocalError<T>>, command: T) => {
    this.config.onFinished?.(response, command);
  };
}
