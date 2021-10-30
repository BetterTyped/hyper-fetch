export type ActionsType<T> = {
  setData: (data: T) => void;
};

export type UseFetchReturnType<T> = {
  // data: T
  // isLoading: boolean
  // error: T
  // actions: ActionsType<T>
  // onSuccess: fn (data, isRefreshed)
  // onError: fn (data, isRefreshed)
  // onFinished: fn (data, error, isRefreshed)
  // status: number 200 404 etc
  // isCanceled: bool
  // isCached: bool
  // isRefreshed: bool
  // timestamp: Date
  // isSuccess: bool
  // isError: bool
  // isRefreshingError: bool
  // isDebounce: bool
  // failureCount: number
  // fetchCount: number
  // refresh: fn
  // invalidateCache: fn - jednocześnie triggeruje refresh
  // cancel: fn
};
