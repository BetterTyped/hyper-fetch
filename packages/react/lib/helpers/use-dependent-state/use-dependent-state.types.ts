import {
  Dispatcher,
  ExtractError,
  CacheValueType,
  ExtractResponse,
  ClientResponseType,
  CommandInstance,
  LoggerMethodsType,
} from "@better-typed/hyper-fetch";

export type UseDependentStateProps<T extends CommandInstance> = {
  command: T;
  logger: LoggerMethodsType;
  initialData: ClientResponseType<ExtractResponse<T>, ExtractError<T>> | null;
  dispatcher: Dispatcher;
  dependencyTracking: boolean;
  defaultCacheEmitting?: boolean;
};

export type UseDependentStateReturn<T extends CommandInstance> = [
  UseDependentStateType<ExtractResponse<T>, ExtractError<T>>,
  UseDependentStateActions<ExtractResponse<T>, ExtractError<T>>,
  {
    setRenderKey: (renderKey: keyof UseDependentStateType) => void;
    isInitialized: boolean;
    setCacheData: (cacheData: CacheValueType<ExtractResponse<T>, ExtractError<T>>) => void;
    getStaleStatus: () => Promise<boolean>;
  },
];

export type UseDependentStateType<DataType = unknown, ErrorType = unknown> = {
  data: null | DataType;
  error: null | ErrorType;
  loading: boolean;
  status: null | number;
  retries: number;
  timestamp: null | Date;
};

export type UseDependentStateActions<DataType, ErrorType> = {
  setData: (data: DataType, emitToCache?: boolean) => void;
  setError: (error: ErrorType, emitToCache?: boolean) => void;
  setLoading: (loading: boolean, emitToHooks?: boolean) => void;
  setStatus: (status: number | null, emitToCache?: boolean) => void;
  setRetries: (retries: number, emitToCache?: boolean) => void;
  setTimestamp: (timestamp: Date, emitToCache?: boolean) => void;
};
