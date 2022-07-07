import {
  Dispatcher,
  ExtractError,
  CacheValueType,
  ExtractResponse,
  LoggerMethodsType,
  FetchProgressType,
  ExtractFetchReturn,
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

// Return
export type UseCommandEventsReturnType<T extends CommandInstance> = [
  {
    abort: () => void;
    onSuccess: (callback: OnSuccessCallbackType<T>) => void;
    onError: (callback: OnErrorCallbackType<T>) => void;
    onAbort: (callback: OnErrorCallbackType<T>) => void;
    onOfflineError: (callback: OnErrorCallbackType<T>) => void;
    onFinished: (callback: OnFinishedCallbackType<T>) => void;
    onRequestStart: (callback: OnStartCallbackType<T>) => void;
    onResponseStart: (callback: OnStartCallbackType<T>) => void;
    onDownloadProgress: (callback: OnProgressCallbackType) => void;
    onUploadProgress: (callback: OnProgressCallbackType) => void;
  },
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
  params: CallbackParameters<Command, ExtractFetchReturn<Command>>,
) => void;
export type OnStartCallbackType<Command extends CommandInstance> = (params: {
  details: CommandEventDetails<Command>;
  command: Command;
}) => void;
export type OnProgressCallbackType = (progress: FetchProgressType) => void;
