import { ExtractError } from "types";
import { FetchEffectConfig } from "effect";
import { FetchCommandInstance } from "command";
import { ClientResponseErrorType, ClientResponseType, ClientResponseSuccessType } from "client";

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
  onError = (response: ClientResponseErrorType<ExtractError<T>>, command: T) => {
    this.config.onError?.(response, command);
  };
  onFinished = (response: ClientResponseType<ResponseType, ExtractError<T>>, command: T) => {
    this.config.onFinished?.(response, command);
  };
}
