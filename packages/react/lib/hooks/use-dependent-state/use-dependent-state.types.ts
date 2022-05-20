export type UseDependentStateType<DataType = any, ErrorType = any> = {
  data: null | DataType;
  error: null | ErrorType;
  loading: boolean;
  status: null | number;
  retries: number;
  timestamp: null | Date;
  isRefreshed: boolean;
  isOnline: boolean;
  isFocused: boolean;
};

export type UseDependentStateActions<DataType, ErrorType> = {
  setData: (data: DataType, emitToCache?: boolean) => void;
  setError: (error: ErrorType, emitToCache?: boolean) => void;
  setLoading: (loading: boolean, emitToHooks?: boolean) => void;
  setStatus: (status: number | null, emitToCache?: boolean) => void;
  setRefreshed: (isRefreshed: boolean, emitToCache?: boolean) => void;
  setRetries: (retries: number, emitToCache?: boolean) => void;
  setTimestamp: (timestamp: Date, emitToCache?: boolean) => void;
};
