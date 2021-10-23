/**
 * const {
 submit fn
 isSubmitting: boolean
 error: T
 onCallSuccess: fn (data)
 onCallError: fn (data)
 onCallFinished: fn (data, error)
 timestamp: Date
 isDebouncing: bool
 isOffline: bool
 failureCount: number
 fetchCount: number
 queueCount: number
 queue: []
} = useFetch({
 queueId: string
 triggerRefresh: cacheIds/requestsIds[] - id requestow
 queueType: single / multiple
 retry: bool / number
 retryTime: number
 throw: bool
 middleware: []
 offline: bool
})
 */

export const useCall = () => {
  return false;
  // return (
  //   // data: T
  //   // isLoading: boolean
  //   // error: T
  //   // actions: setters
  //   // onSuccess: fn (data, isRefreshed)
  //   // onError: fn (data, isRefreshed)
  //   // onFinished: fn (data, error, isRefreshed)
  //   // status: number 200 404 etc
  //   // isCanceled: bool
  //   // isCached: bool
  //   // isRefreshed: bool
  //   // timestamp: Date
  //   // isSuccess: bool
  //   // isError: bool
  //   // isRefreshingError: bool
  //   // isDebounce: bool
  //   // failureCount: number
  //   // fetchCount: number
  //   // refresh: fn
  //   // invalidateCache: fn - jednocześnie triggeruje refresh
  //   // cancel: fn
  // )
};
