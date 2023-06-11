import { ExtractAdapterReturnType, NullableType, RequestInstance, RequestSendType } from "@hyper-fetch/core";

import { isEqual } from "utils";
import {
  OnErrorCallbackType,
  OnFinishedCallbackType,
  OnProgressCallbackType,
  OnStartCallbackType,
  OnSuccessCallbackType,
  UseTrackedStateType,
  UseTrackedStateActions,
} from "helpers";
import { InvalidationKeyType } from "types";

export type UseSubmitOptionsType<T extends RequestInstance> = {
  /**
   * Disable fetching
   */
  disabled?: boolean;
  /**
   * If cache is empty we can use placeholder data.
   */
  initialData?: NullableType<Partial<ExtractAdapterReturnType<T>>>;
  /**
   * Enable/disable debouncing for often changing keys or refreshing, to limit requests to server.
   */
  bounce?: boolean;
  /**
   * If `true` it will rerender only when values used by our component gets changed. Otherwise it will rerender on any change.
   */
  dependencyTracking?: boolean;
  /**
   * Deep comparison function for hook to check for equality in incoming data, to limit rerenders.
   */
  deepCompare?: boolean | typeof isEqual;
} & (
  | {
      /**
       * Possibility to choose between debounce and throttle approaches
       */
      bounceType?: "debounce";
      /**
       * How long it should bounce requests.
       */
      bounceTime?: number;
    }
  | {
      /**
       * Possibility to choose between debounce and throttle approaches
       */
      bounceType: "throttle";
      /**
       * How long it should interval requests.
       */
      bounceTime?: number;
      /**
       * ONLY in throttle mode - options for handling last bounce event
       */
      bounceTimeout?: number;
    }
);

export type UseSubmitReturnType<RequestType extends RequestInstance> = Omit<
  UseTrackedStateType<RequestType>,
  "loading"
> &
  UseTrackedStateActions<RequestType> & {
    /**
     * Callback which allows to cancel ongoing requests from given queueKey.
     */
    abort: () => void;
    /**
     * Helper hook listening on success response.
     */
    onSubmitSuccess: (callback: OnSuccessCallbackType<RequestType>) => void;
    /**
     * Helper hook listening on error response.
     */
    onSubmitError: (callback: OnErrorCallbackType<RequestType>) => void;
    /**
     * Helper hook listening on any response.
     */
    onSubmitFinished: (callback: OnFinishedCallbackType<RequestType>) => void;
    /**
     * Helper hook listening on request start.
     */
    onSubmitRequestStart: (callback: OnStartCallbackType<RequestType>) => void;
    /**
     * Helper hook listening on response start(before we receive all data from server).
     */
    onSubmitResponseStart: (callback: OnStartCallbackType<RequestType>) => void;
    /**
     * Helper hook listening on download progress ETA. We can later match given requests by their id's or request instance which holds all data which is being transferred.
     */
    onSubmitDownloadProgress: (callback: OnProgressCallbackType) => void;
    /**
     * Helper hook listening on upload progress ETA. We can later match given requests by their id's or request instance which holds all data which is being transferred.
     */
    onSubmitUploadProgress: (callback: OnProgressCallbackType) => void;
    /**
     * Helper hook listening on aborting of requests. Abort events are not triggering onError callbacks.
     */
    onSubmitAbort: (callback: OnErrorCallbackType<RequestType>) => void;
    /**
     * Helper hook listening on request going into offline awaiting for network connection to be restored. It will not trigger onError when 'offline' mode is set on request.
     */
    onSubmitOfflineError: (callback: OnErrorCallbackType<RequestType>) => void;
    /**
     * Method responsible for triggering requests. It return Promise which will be resolved with the request.
     */
    submit: RequestSendType<RequestType>;
    /**
     * Request loading state
     */
    submitting: boolean;
    /**
     * Data related to current state of the bounce usage
     */
    bounce: {
      /**
       * Active state of the bounce method
       */
      active: boolean;
      /**
       * Method to stop the active bounce method execution
       */
      reset: () => void;
    };
    /**
     * Refetch current request resource or pass custom key to trigger it by invalidationKey(Regex / cacheKey).
     */
    refetch: (invalidateKey: InvalidationKeyType | InvalidationKeyType[]) => void;
  };
