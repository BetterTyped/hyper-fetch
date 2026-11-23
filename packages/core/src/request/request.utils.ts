import { getErrorMessage } from "adapter";
import type { AdapterInstance, ProgressType, RequestResponseType, ResponseType } from "adapter";
import { SAFE_HTTP_METHODS } from "constants/http.constants";
import type { Dispatcher } from "dispatcher";
import type { RequestResponseEventType } from "managers";
import type { OptimisticPendingType } from "optimistic";
import { applyOptimistic, getOptimisticResult, optimistic, settleOptimistic } from "optimistic";
import type { ExtractAdapterType, ExtractErrorType } from "types";
import { runUserCode } from "utils";

import type {
  OptimisticCallbackResult,
  OptimisticSendOptionType,
  ProgressEventType,
  RequestInstance,
  RequestJSON,
  RequestSendActionsType,
  RequestSendOptionsType,
  RetryTimeFunctionType,
} from "./request.types";

type MappedResponse =
  | ResponseType<any, any, AdapterInstance>
  | Promise<ResponseType<any, any, AdapterInstance>>
  | undefined;

/**
 * Turns query params given as a callback into data with the adapter's resolver, so a request never stores a function.
 * Without a resolver the value is kept as given.
 */
export const resolveQueryParams = <T>(
  client: { adapter: Pick<AdapterInstance, "unstable_queryParamsResolver"> },
  queryParams: T,
): T => {
  const resolver = client.adapter.unstable_queryParamsResolver;
  if (typeof queryParams === "function" && resolver) {
    return resolver(queryParams as (...args: any[]) => unknown) as T;
  }
  return queryParams;
};

export const scopeKey = (key: string, scope: string | null): string => {
  return scope ? `${scope}__${key}` : key;
};

export const stringifyKey = (value: unknown): string => {
  try {
    if (typeof value === "string") {
      return value;
    }
    if (value === undefined || value === null) {
      return "";
    }
    const data = JSON.stringify(value);
    if (typeof data !== "string") {
      throw new TypeError();
    }
    return data;
  } catch {
    return "";
  }
};

export const getProgressValue = ({ loaded, total }: ProgressEventType): number => {
  if (!loaded || !total) {
    return 0;
  }
  return Number(((loaded * 100) / total).toFixed(0));
};

export const getRequestEta = (
  startDate: Date,
  progressDate: Date,
  { total, loaded }: ProgressEventType,
): { sizeLeft: number; timeLeft: number | null } => {
  const timeElapsed = +progressDate - +startDate || 1;
  const uploadSpeed = loaded / timeElapsed;
  const totalValue = Math.max(total, loaded);
  const sizeLeft = totalValue - loaded;
  const estimatedTimeValue = uploadSpeed ? sizeLeft / uploadSpeed : null;
  const timeLeft = totalValue === loaded ? 0 : estimatedTimeValue;

  return { timeLeft, sizeLeft };
};

export const getProgressData = (
  requestStartTime: Date,
  progressDate: Date,
  progressEvent: ProgressEventType,
): ProgressType => {
  const { total, loaded } = progressEvent;
  if (Number.isNaN(total) || Number.isNaN(loaded)) {
    return {
      progress: 0,
      timeLeft: 0,
      sizeLeft: 0,
      total: 0,
      loaded: 0,
      startTimestamp: +requestStartTime,
    };
  }

  const { timeLeft, sizeLeft } = getRequestEta(requestStartTime, progressDate, progressEvent);

  return {
    progress: getProgressValue(progressEvent),
    timeLeft,
    sizeLeft,
    total,
    loaded,
    startTimestamp: +requestStartTime,
  };
};

// Keys
export const getSimpleKey = (request: RequestInstance | RequestJSON<RequestInstance>): string => {
  return `${request.method}_${request.requestOptions.endpoint}_${request.cancelable}`;
};

/**
 * Cache instance for individual request that collects individual requests responses from
 * the same endpoint (they may differ base on the custom key, endpoint params etc)
 * @param request
 * @param useInitialValues
 * @returns
 */
export const getRequestKey = (
  request: RequestInstance | RequestJSON<RequestInstance>,
  useInitialValues?: boolean,
): string => {
  /**
   * Below stringified values allow to match the response by method, endpoint and query params.
   * That's because we have shared endpoint, but data with queryParams '?user=1' will not match regular request without queries.
   * We want both results to be cached in separate places to not override each other.
   *
   * Values to be stringified:
   *
   * endpoint: string;
   * queryParams: string;
   * params: string;
   */
  const methodKey = stringifyKey(request.method);
  const endpointKey = useInitialValues ? request.requestOptions.endpoint : stringifyKey(request.endpoint);
  const queryParamsKey = useInitialValues ? "" : stringifyKey(request.queryParams);

  return `${methodKey}_${endpointKey}_${queryParamsKey}`;
};

export const getRequestDispatcher = <Request extends RequestInstance>(
  request: Request,
  dispatcherType: "auto" | "fetch" | "submit" = "auto",
): [Dispatcher<ExtractAdapterType<Request>>, isFetchDispatcher: boolean] => {
  const { fetchDispatcher, submitDispatcher } = request.client;
  const isSafeRead = SAFE_HTTP_METHODS.includes(request.method as string);
  const isFetchDispatcher = (dispatcherType === "auto" && isSafeRead) || dispatcherType === "fetch";
  const dispatcher = isFetchDispatcher ? fetchDispatcher : submitDispatcher;

  return [dispatcher, isFetchDispatcher];
};

/**
 * Runs the response mapper of the request. Mapper is user code running in the middle of the response handling,
 * so its failure is logged and ends up as a failed response carrying the thrown value as the `error`.
 * Failures are always delivered through a promise, so sync and async mappers fail the same way.
 * @internal
 * @param request request with the optional response mapper
 * @param response response to be mapped
 * @returns mapped response, promise of it for async and failed mappers, `undefined` when there is no mapper
 */
export const runResponseMapper = <Request extends RequestInstance>(
  request: Request,
  response: ResponseType<any, any, AdapterInstance>,
): MappedResponse => {
  const getFailedResponse = (error: unknown) => {
    request.client.logger.error({
      title: "Response mapper failed",
      type: "system",
      extra: { error, request, response },
    });

    return { ...response, data: null, error, success: false } as ResponseType<any, any, AdapterInstance>;
  };

  try {
    const mapping = request.unstable_responseMapper?.(response as ResponseType<any, any, ExtractAdapterType<Request>>);

    return mapping instanceof Promise ? mapping.catch(getFailedResponse) : mapping;
  } catch (error) {
    return Promise.resolve(getFailedResponse(error));
  }
};

export const mapResponseForSend = async <Request extends RequestInstance>(
  request: Request,
  response: ResponseType<any, any, AdapterInstance>,
): Promise<RequestResponseType<Request>> => {
  const mapping = runResponseMapper(request, response);

  if (mapping instanceof Promise) {
    return (await mapping) as RequestResponseType<Request>;
  }

  return (mapping || response) as RequestResponseType<Request>;
};

/**
 * Passes the lifecycle events of one request id to the callbacks given to `send()` / `exec()` and to the request
 * `$hooks`. Returns the function that removes the listeners.
 */
export const subscribeRequestCallbacks = <Request extends RequestInstance>({
  request,
  requestId,
  options,
  mutationContext,
}: {
  request: Request;
  requestId: string;
  options: RequestSendActionsType<Request> | undefined;
  mutationContext?: OptimisticCallbackResult<any>;
}) => {
  const { requestManager } = request.client;
  const { $hooks } = request;

  const unmounts = [
    requestManager.events.onRequestStartById<Request>(requestId, (data) => {
      const enriched = { ...data, mutationContext };
      runUserCode(() => options?.onRequestStart?.(enriched));
      runUserCode(() => $hooks.__emit("onRequestStart", enriched));
    }),
    requestManager.events.onResponseStartById<Request>(requestId, (data) => {
      const enriched = { ...data, mutationContext };
      runUserCode(() => options?.onResponseStart?.(enriched));
      runUserCode(() => $hooks.__emit("onResponseStart", enriched));
    }),
    requestManager.events.onUploadProgressById<Request>(requestId, (data) => {
      const enriched = { ...data, mutationContext };
      runUserCode(() => options?.onUploadProgress?.(enriched));
      runUserCode(() => $hooks.__emit("onUploadProgress", enriched));
    }),
    requestManager.events.onDownloadProgressById<Request>(requestId, (data) => {
      const enriched = { ...data, mutationContext };
      runUserCode(() => options?.onDownloadProgress?.(enriched));
      runUserCode(() => $hooks.__emit("onDownloadProgress", enriched));
    }),
    // Failed attempts which are retried do not reach `onResponse` - this is how they are announced
    requestManager.events.onRetryById<Request>(requestId, (data) => {
      const enriched = { ...data, mutationContext };
      runUserCode(() => options?.onRetry?.(enriched));
      runUserCode(() => $hooks.__emit("onRetry", enriched));
    }),
  ];

  return () => unmounts.forEach((unmount) => unmount());
};

/**
 * Calls `onAbort` once when the signal of the caller aborts - right away when it is aborted already. The signal only
 * triggers the abort controller HyperFetch keeps for the request, so it ends like `request.abort()` does. Returns the
 * function that stops listening.
 */
export const linkAbortSignal = (signal: AbortSignal | undefined, onAbort: () => void) => {
  if (!signal) {
    return () => {};
  }
  if (signal.aborted) {
    onAbort();
    return () => {};
  }
  signal.addEventListener("abort", onAbort, { once: true });
  return () => signal.removeEventListener("abort", onAbort);
};

/** Response of a call that was aborted before the adapter could answer it */
export const getAbortedResponse = <Request extends RequestInstance>(request: Request): RequestResponseType<Request> => {
  const { adapter } = request.client;
  return {
    data: null,
    error: adapter.unstable_internalErrorMapping(getErrorMessage("abort")) as ExtractErrorType<Request>,
    status: null,
    success: false,
    extra: adapter.defaultExtra,
    requestTimestamp: Date.now(),
    responseTimestamp: Date.now(),
  };
};

export const sendRequest = async <Request extends RequestInstance>(
  request: Request,
  options?: RequestSendOptionsType<Request>,
): Promise<RequestResponseType<Request>> => {
  const { client } = request;
  const { requestManager } = client;
  const [dispatcher] = getRequestDispatcher(request, options?.dispatcherType);
  const signal = options?.signal;

  // Nothing is queued, sent or optimistically changed for a call that was aborted before it started
  if (signal?.aborted) {
    return getAbortedResponse(request);
  }

  let mutationContext: OptimisticCallbackResult<any> | undefined;
  let pendingOptimistic: OptimisticPendingType | undefined;
  // The per-call option replaces the optimistic callback of the request
  const optimisticSource = (options?.optimistic ?? request.optimistic) as
    | OptimisticSendOptionType<RequestInstance>
    | undefined;

  if (optimisticSource) {
    try {
      const result = Array.isArray(optimisticSource)
        ? optimisticSource
        : optimisticSource({
            request,
            client: request.client,
            payload: request.payload,
            params: request.params,
            queryParams: request.queryParams,
            optimistic,
          });
      // Synchronous callbacks change the cache within the send() call, async ones once they resolve
      mutationContext = getOptimisticResult(result instanceof Promise ? await result : result);
    } catch (error) {
      return {
        data: null,
        error: new Error(
          `Optimistic callback failed: ${error instanceof Error ? error.message : error}`,
        ) as unknown as ExtractErrorType<Request>,
        status: null,
        success: false,
        extra: client.adapter.defaultExtra,
        requestTimestamp: Date.now(),
        responseTimestamp: Date.now(),
      };
    }
    pendingOptimistic = applyOptimistic(client, mutationContext);
  }

  return new Promise<RequestResponseType<Request>>((resolve) => {
    // The dispatcher is done with the request - removal from the queue that follows is not a separate outcome
    let isResolved = false;
    let isDelivered = false;
    let isSettled = false;
    const queryKey = scopeKey(request.queryKey, request.scope);
    // A deduplicated call gets the id of the request it joined, which was in the queue before
    const queuedIds = signal ? new Set(dispatcher.getQueue(queryKey).requests.map((item) => item.requestId)) : null;
    const requestId = dispatcher.add(request);
    const isJoined = !!queuedIds?.has(requestId);
    // Set when the signal of the caller took the request out of the queue before it was sent
    let isRemovedBySignal = false;
    let unlinkSignal = () => {};
    const { $hooks } = request;

    // Failed attempts stay in the dispatcher queue when they are going to be sent again
    const getWillBeResent = ({ response, details }: RequestResponseEventType<Request>) => {
      if (response.success || details.isCanceled) {
        return false;
      }
      // One that was taken out of the queue while it was running (cleared queue) has just given its last response
      if (!dispatcher.getRequest(queryKey, requestId)) {
        return false;
      }
      return details.willRetry || (request.offline && details.isOffline);
    };

    // Settlement and delivery read the same event - the mapper has to run only once per response
    const mappings = new WeakMap<RequestResponseEventType<Request>, MappedResponse>();
    const getMapping = (values: RequestResponseEventType<Request>) => {
      if (!mappings.has(values)) {
        mappings.set(values, runResponseMapper(request, values.response));
      }
      return mappings.get(values);
    };

    // Attached ahead of `onBeforeSent`, so listeners added there already observe the settled cache
    const unmountSettlement = pendingOptimistic
      ? requestManager.events.onResponseById<Request>(requestId, (values) => {
          const pending = pendingOptimistic as OptimisticPendingType;
          const willBeResent = getWillBeResent(values);

          const settle = (response: ResponseType<any, any, AdapterInstance>) => {
            if (isSettled || (!response.success && willBeResent)) {
              return;
            }
            isSettled = true;

            if (values.details.isCanceled) {
              settleOptimistic(pending, { type: "rollback", reason: "abort", response, request });
            } else if (response.success) {
              settleOptimistic(pending, { type: "success", response, request });
            } else {
              settleOptimistic(pending, { type: "rollback", reason: "error", response, request });
            }
          };

          const mapping = getMapping(values);
          if (mapping instanceof Promise) {
            mapping.then(settle);
          } else {
            settle(mapping || values.response);
          }
        })
      : undefined;

    const beforeSentData = { requestId, request, mutationContext };
    runUserCode(() => options?.onBeforeSent?.(beforeSentData));
    runUserCode(() => $hooks.__emit("onBeforeSent", beforeSentData));

    const unmountCallbacks = subscribeRequestCallbacks({ request, requestId, options, mutationContext });

    // When resolved
    const unmountResponse = requestManager.events.onResponseById<Request>(requestId, (values) => {
      const { response } = values;
      const willBeResent = getWillBeResent(values);
      isResolved = !willBeResent;
      const enrichedValues = { ...values, mutationContext };

      const mapping = getMapping(values);

      const handleResponse = (success: boolean, data: ResponseType<any, any, ExtractAdapterType<Request>>) => {
        // Retries and offline postponing end with another response we need to listen for
        if (isDelivered || (!success && willBeResent)) {
          return;
        }
        isDelivered = true;

        runUserCode(() => options?.onResponse?.(enrichedValues));
        runUserCode(() => $hooks.__emit("onResponse", enrichedValues));
        resolve(data);

        // Unmount Listeners
        // eslint-disable-next-line @typescript-eslint/no-use-before-define, @typescript-eslint/no-use-before-define
        umountAll();
      };

      // Create async await ONLY when we make a promise mapper
      if (mapping instanceof Promise) {
        (async () => {
          const responseData = await mapping;

          const { success } = responseData;
          handleResponse(success, responseData as ResponseType<any, any, ExtractAdapterType<Request>>);
        })();
      }
      // For sync mapping operations we should not use async actions
      else {
        const data = mapping || response;
        const { success } = data;
        handleResponse(success, data);
      }
    });

    // When removed from queue storage we need to clean event listeners and return proper error
    const unmountRemoveQueueElement = requestManager.events.onRemoveById<Request>(requestId, (data) => {
      if (!isResolved) {
        isResolved = true;
        isDelivered = true;

        // Taken out of the queue by the signal of the caller, it ends the same way an aborted request does
        const removedResponse: RequestResponseType<Request> = isRemovedBySignal
          ? getAbortedResponse(request)
          : {
              data: null,
              status: null,
              success: false,
              error: getErrorMessage("deleted") as unknown as ExtractErrorType<Request>,
              extra: request.client.adapter.defaultExtra,
              requestTimestamp: Date.now(),
              responseTimestamp: Date.now(),
            };

        if (pendingOptimistic && !isSettled) {
          isSettled = true;
          settleOptimistic(
            pendingOptimistic,
            isRemovedBySignal
              ? { type: "rollback", reason: "abort", response: removedResponse, request }
              : { type: "rollback", reason: "removed", request },
          );
        }

        const enriched = { ...data, mutationContext };
        runUserCode(() => options?.onRemove?.(enriched));
        runUserCode(() => $hooks.__emit("onRemove", enriched));
        resolve(removedResponse);

        // Unmount Listeners
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        umountAll();
      }
    });

    // Linked last - an abort can remove the request synchronously and the listeners above have to observe it
    unlinkSignal = linkAbortSignal(signal, () => {
      if (isDelivered) {
        return;
      }
      // The joined request belongs to the other callers as well - only this call stops waiting for it
      if (isJoined) {
        isResolved = true;
        isDelivered = true;
        const aborted = getAbortedResponse(request);
        if (pendingOptimistic && !isSettled) {
          isSettled = true;
          settleOptimistic(pendingOptimistic, { type: "rollback", reason: "abort", response: aborted, request });
        }
        resolve(aborted);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        umountAll();
        return;
      }
      const abortKey = scopeKey(request.abortKey, request.scope);
      // A running request is aborted like `request.abort()` does, only this one by its id
      if (dispatcher.hasRunningRequest(queryKey, requestId)) {
        requestManager.abortByRequestId(abortKey, requestId);
        return;
      }
      // A queued one, or one waiting for its retry or for the connection, is not sent at all
      isRemovedBySignal = true;
      dispatcher.delete(queryKey, requestId, abortKey);
    });

    function umountAll() {
      unmountSettlement?.();
      unmountCallbacks();
      unmountResponse();
      unmountRemoveQueueElement();
      unlinkSignal();
    }
  });
};

/** Above this exponent `min * 2 ** attempt` is past any sane maximum, and a larger one only risks Infinity */
const MAX_BACKOFF_EXPONENT = 30;

/**
 * Retry time that grows exponentially with every attempt: `min * 2 ** attempt`, never above `max`. With `jitter` (the
 * default) the delay is a random value from `min` up to that window, so the clients that failed together do not all
 * retry at the same moment.
 *
 * @example
 * client.createRequest()({ endpoint: "/users", retry: 5, retryTime: exponentialBackoff({ min: 500, max: 10_000 }) });
 */
export const exponentialBackoff = ({
  min = 500,
  max = 30_000,
  jitter = true,
  random = Math.random,
}: {
  /** Delay of the first retry in milliseconds. @default 500 */
  min?: number;
  /** Longest delay in milliseconds. @default 30000 */
  max?: number;
  /** Spread the delays randomly between `min` and the exponential window. @default true */
  jitter?: boolean;
  /** Source of the randomness, for deterministic tests. @default Math.random */
  random?: () => number;
} = {}): RetryTimeFunctionType => {
  return ({ attempt }) => {
    const floor = Math.max(0, min);
    const exponent = Math.min(Math.max(0, attempt), MAX_BACKOFF_EXPONENT);
    const exponential = floor * 2 ** exponent;

    if (!jitter) {
      return Math.min(max, exponential);
    }
    const window = Math.max(0, Math.min(max - floor, exponential));
    return Math.round(floor + random() * window);
  };
};
