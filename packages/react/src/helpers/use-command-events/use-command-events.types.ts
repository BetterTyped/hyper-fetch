import {
  Dispatcher,
  ExtractError,
  CacheValueType,
  ExtractResponse,
  LoggerMethodsType,
  FetchProgressType,
  ExtractClientReturnType,
  CommandEventDetails,
  CommandInstance,
  CommandResponseDetails,
} from "@better-typed/hyper-fetch";

import { UseTrackedStateActions } from "helpers";

// Misc
export type UseCommandEventsDataMap = { unmount: VoidFunction };
export type UseCommandEventsLifecycleMap = Map<string, { unmount: VoidFunction }>;

// Props
export type UseCommandEventsOptionsType<T extends CommandInstance> = {
  command: T;
  dispatcher: Dispatcher;
  logger: LoggerMethodsType;
  actions: UseTrackedStateActions<T>;
  setCacheData: (cacheData: CacheValueType<ExtractResponse<T>, ExtractError<T>>) => void;
};

export type UseCommandEventsActionsType<T extends CommandInstance> = {
  /**
   * Callback which allows to cancel ongoing requests from given queueKey.
   */
  abort: () => void;
  /**
   * Helper hook listening on success response.
   */
  onSuccess: (callback: OnSuccessCallbackType<T>) => void;
  /**
   * Helper hook listening on error response.
   */
  onError: (callback: OnErrorCallbackType<T>) => void;
  /**
   * Helper hook listening on aborting of requests. Abort events are not triggering onError callbacks.
   */
  onAbort: (callback: OnErrorCallbackType<T>) => void;
  /**
   * Helper hook listening on request going into offline awaiting for network connection to be restored. It will not trigger onError when 'offline' mode is set on command.
   */
  onOfflineError: (callback: OnErrorCallbackType<T>) => void;
  /**
   * Helper hook listening on any response.
   */
  onFinished: (callback: OnFinishedCallbackType<T>) => void;
  /**
   * Helper hook listening on request start.
   */
  onRequestStart: (callback: OnStartCallbackType<T>) => void;
  /**
   * Helper hook listening on response start(before we receive all data from server).
   */
  onResponseStart: (callback: OnStartCallbackType<T>) => void;
  /**
   * Helper hook listening on download progress ETA. We can later match given requests by their id's or command instance which holds all data which is being transferred.
   */
  onDownloadProgress: (callback: OnProgressCallbackType) => void;
  /**
   * Helper hook listening on upload progress ETA. We can later match given requests by their id's or command instance which holds all data which is being transferred.
   */
  onUploadProgress: (callback: OnProgressCallbackType) => void;
};

// Return
export type UseCommandEventsReturnType<T extends CommandInstance> = [
  UseCommandEventsActionsType<T>,
  {
    addDataListener: (command: CommandInstance) => VoidFunction;
    clearDataListener: VoidFunction;
    addLifecycleListeners: (command: CommandInstance, requestId?: string) => VoidFunction;
    removeLifecycleListener: (requestId: string) => void;
    clearLifecycleListeners: () => void;
  },
];

// Lifecycle

export type CallbackParameters<Command, ResponseType> = {
  response: ResponseType;
  details: CommandResponseDetails;
  command: Command;
};

export type OnSuccessCallbackType<Command extends CommandInstance> = (
  params: CallbackParameters<Command, ExtractResponse<Command>>,
) => void;
export type OnErrorCallbackType<Command extends CommandInstance> = (
  params: CallbackParameters<Command, ExtractError<Command>>,
) => void;
export type OnFinishedCallbackType<Command extends CommandInstance> = (
  params: CallbackParameters<Command, ExtractClientReturnType<Command>>,
) => void;
export type OnStartCallbackType<Command extends CommandInstance> = (params: {
  details: CommandEventDetails<Command>;
  command: Command;
}) => void;
export type OnProgressCallbackType = (progress: FetchProgressType) => void;
