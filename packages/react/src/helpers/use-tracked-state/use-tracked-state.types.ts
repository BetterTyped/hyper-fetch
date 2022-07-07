import {
  Dispatcher,
  ExtractError,
  CacheValueType,
  ExtractResponse,
  ClientResponseType,
  CommandInstance,
  LoggerMethodsType,
} from "@better-typed/hyper-fetch";
import { isEqual } from "utils";

export type UseTrackedStateProps<T extends CommandInstance> = {
  command: T;
  logger: LoggerMethodsType;
  initialData: ClientResponseType<ExtractResponse<T>, ExtractError<T>> | null;
  dispatcher: Dispatcher;
  dependencyTracking: boolean;
  defaultCacheEmitting?: boolean;
  deepCompare: boolean | typeof isEqual;
};

export type UseTrackedStateReturn<T extends CommandInstance> = [
  UseTrackedStateType<T>,
  UseTrackedStateActions<T>,
  {
    setRenderKey: (renderKey: keyof UseTrackedStateType<T>) => void;
    setCacheData: (cacheData: CacheValueType<ExtractResponse<T>, ExtractError<T>>) => void;
    getStaleStatus: () => boolean;
  },
];

export type UseTrackedStateType<T extends CommandInstance = CommandInstance> = {
  data: null | ExtractResponse<T>;
  error: null | ExtractError<T>;
  loading: boolean;
  status: null | number;
  retries: number;
  timestamp: null | Date;
};

export type UseTrackedStateActions<T extends CommandInstance> = {
  setData: (data: ExtractResponse<T>, emitToCache?: boolean) => void;
  setError: (error: ExtractError<T>, emitToCache?: boolean) => void;
  setLoading: (loading: boolean, emitToHooks?: boolean) => void;
  setStatus: (status: number | null, emitToCache?: boolean) => void;
  setRetries: (retries: number, emitToCache?: boolean) => void;
  setTimestamp: (timestamp: Date, emitToCache?: boolean) => void;
};
