import { ExtractAdapterType, ExtractErrorType, ExtractResponseType } from "types";
import { RequestEffectOptionsType } from "effect";
import { RequestInstance } from "request";
import { ResponseReturnErrorType, ResponseReturnType, ResponseReturnSuccessType } from "adapter";

export class RequestEffect<T extends RequestInstance> {
  constructor(public config: RequestEffectOptionsType<T>) {}

  getEffectKey = () => {
    return this.config.effectKey;
  };

  onTrigger = (request: T) => {
    this.config.onTrigger?.(request);
  };
  onStart = (request: T) => {
    this.config.onStart?.(request);
  };
  onSuccess = (response: ResponseReturnSuccessType<ExtractResponseType<T>, ExtractAdapterType<T>>, request: T) => {
    this.config.onSuccess?.(response, request);
  };
  onError = (response: ResponseReturnErrorType<ExtractErrorType<T>, ExtractAdapterType<T>>, request: T) => {
    this.config.onError?.(response, request);
  };
  onFinished = (
    response: ResponseReturnType<ExtractResponseType<T>, ExtractErrorType<T>, ExtractAdapterType<T>>,
    request: T,
  ) => {
    this.config.onFinished?.(response, request);
  };
}
