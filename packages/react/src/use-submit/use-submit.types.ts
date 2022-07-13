import { CacheValueType, ExtractError, ExtractResponse, CommandInstance } from "@better-typed/hyper-fetch";

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

export type UseSubmitOptionsType<T extends CommandInstance> = {
  /**
   * Disable fetching
   */
  disabled?: boolean;
  /**
   * If cache is empty we can use placeholder data.
   */
  initialData?: CacheValueType<ExtractResponse<T>, ExtractError<T>>["data"] | null;
  /**
   * Enable/disable debouncing for often changing keys or refreshing, to limit requests to server.
   */
  debounce?: boolean;
  /**
   * How long it should debounce requests.
   */
  debounceTime?: number;
  /**
   * If `true` it will rerender only when values used by our component gets changed. Otherwise it will rerender on any change.
   */
  dependencyTracking?: boolean;
  /**
   * Deep comparison function for hook to check for equality in incoming data, to limit rerenders.
   */
  deepCompare?: boolean | typeof isEqual;
};

export type UseSubmitReturnType<T extends CommandInstance> = Omit<UseTrackedStateType<T>, "loading"> &
  UseTrackedStateActions<T> & {
    /**
     * Callback which allows to cancel ongoing requests from given queueKey.
     */
    abort: () => void;
    /**
     * Helper hook listening on success response.
     */
    onSubmitSuccess: (callback: OnSuccessCallbackType<T>) => void;
    /**
     * Helper hook listening on error response.
     */
    onSubmitError: (callback: OnErrorCallbackType<T>) => void;
    /**
     * Helper hook listening on any response.
     */
    onSubmitFinished: (callback: OnFinishedCallbackType<T>) => void;
    /**
     * Helper hook listening on request start.
     */
    onSubmitRequestStart: (callback: OnStartCallbackType<T>) => void;
    /**
     * Helper hook listening on response start(before we receive all data from server).
     */
    onSubmitResponseStart: (callback: OnStartCallbackType<T>) => void;
    /**
     * Helper hook listening on download progress ETA. We can later match given requests by their id's or command instance which holds all data which is being transferred.
     */
    onSubmitDownloadProgress: (callback: OnProgressCallbackType) => void;
    /**
     * Helper hook listening on upload progress ETA. We can later match given requests by their id's or command instance which holds all data which is being transferred.
     */
    onSubmitUploadProgress: (callback: OnProgressCallbackType) => void;
    /**
     * Helper hook listening on aborting of requests. Abort events are not triggering onError callbacks.
     */
    onSubmitAbort: (callback: OnErrorCallbackType<T>) => void;
    /**
     * Helper hook listening on request going into offline awaiting for network connection to be restored. It will not trigger onError when 'offline' mode is set on command.
     */
    onSubmitOfflineError: (callback: OnErrorCallbackType<T>) => void;
    /**
     * Method responsible for triggering requests. It return Promise which will be resolved with the request.
     */
    submit: (...parameters: Parameters<T["send"]>) => void;
    /**
     * Request loading state
     */
    submitting: boolean;
    /**
     * Is debounce active at given moment
     */
    isDebouncing: boolean;
    /**
     * Revalidate current command resource or pass custom key to trigger it by invalidationKey(Regex / cacheKey).
     */
    revalidate: (invalidateKey: string | CommandInstance | RegExp) => void;
  };
