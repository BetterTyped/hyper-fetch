import { RequestInstance } from "request";
import { ResponseErrorType, ResponseType, ResponseSuccessType, ExtractAdapterAdditionalDataType } from "adapter";
import { RequestEffect } from "effect";
import { ExtractAdapterType, ExtractErrorType, ExtractResponseType } from "types";

export type RequestEffectLifecycle = "trigger" | "start" | "success" | "error" | "finished";

export type RequestEffectInstance = RequestEffect<RequestInstance>;

export type RequestEffectOptionsType<T extends RequestInstance> = {
  /**
   * It should match effectKey on the request for which given effect should be triggered.
   */
  effectKey: string;
  /**
   * Callback that will be executed when request gets triggered
   */
  onTrigger?: (request: RequestInstance) => void;
  /**
   * Callback that will be executed when request starts
   */
  onStart?: (request: RequestInstance) => void;
  /**
   * Callback that will be executed when response is successful
   */
  onSuccess?: (
    response: ResponseSuccessType<ExtractResponseType<T>, ExtractAdapterAdditionalDataType<ExtractAdapterType<T>>>,
    request: RequestInstance,
  ) => void;
  /**
   * Callback that will be executed when response is failed
   */
  onError?: (
    response: ResponseErrorType<ExtractErrorType<T>, ExtractAdapterAdditionalDataType<ExtractAdapterType<T>>>,
    request: RequestInstance,
  ) => void;
  /**
   * Callback that will be executed when response is finished
   */
  onFinished?: (
    response: ResponseType<
      ExtractResponseType<T>,
      ExtractErrorType<T>,
      ExtractAdapterAdditionalDataType<ExtractAdapterType<T>>
    >,
    request: RequestInstance,
  ) => void;
};
