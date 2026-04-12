import { getErrorMessage } from "adapter";
import { HttpMethods } from "constants/http.constants";
import type { AdapterInstance, ProgressType, RequestResponseType, ResponseType } from "adapter";
import type { Dispatcher } from "dispatcher";
import type { ExtractAdapterType, ExtractErrorType } from "types";
import type {
  OptimisticCallbackResult,
  ProgressEventType,
  RequestInstance,
  RequestJSON,
  RequestSendOptionsType,
} from "./request.types";

export const scopeKey = (key: string, scope: string | null): string => {
  return scope ? `${scope}__${key}` : key;
};

export const stringifyKey = (value: unknown): string => {
  try {
    if (typeof value === "string") return value;
    if (value === undefined || value === null) return "";
    const data = JSON.stringify(value);
    if (typeof data !== "string") throw new Error();
    return data;
  } catch (_) {
    return "";
  }
};

export const getProgressValue = ({ loaded, total }: ProgressEventType): number => {
  if (!loaded || !total) return 0;
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
  const isGet = request.method === HttpMethods.GET;
  const isFetchDispatcher = (dispatcherType === "auto" && isGet) || dispatcherType === "fetch";
  const dispatcher = isFetchDispatcher ? fetchDispatcher : submitDispatcher;

  return [dispatcher, isFetchDispatcher];
};

export const mapResponseForSend = async <Request extends RequestInstance>(
  request: Request,
  response: ResponseType<any, any, AdapterInstance>,
): Promise<RequestResponseType<Request>> => {
  const mapping = request.unstable_responseMapper?.(response as ResponseType<any, any, ExtractAdapterType<Request>>);

  if (mapping instanceof Promise) {
    return (await mapping) as RequestResponseType<Request>;
  }

  return (mapping || response) as RequestResponseType<Request>;
};

export const sendRequest = async <Request extends RequestInstance>(
  request: Request,
  options?: RequestSendOptionsType<Request>,
): Promise<RequestResponseType<Request>> => {
  const { client } = request;
  const { requestManager } = client;
  const [dispatcher] = getRequestDispatcher(request, options?.dispatcherType);

  let optimisticResult: OptimisticCallbackResult<any> | undefined;

  if (request.optimistic) {
    try {
      optimisticResult = await request.optimistic({
        request,
        client: request.client,
        payload: request.payload,
      });
    } catch (err) {
      return {
        data: null,
        error: new Error(
          `Optimistic callback failed: ${err instanceof Error ? err.message : err}`,
        ) as unknown as ExtractErrorType<Request>,
        status: null,
        success: false,
        extra: client.adapter.defaultExtra,
        requestTimestamp: +new Date(),
        responseTimestamp: +new Date(),
      };
    }
  }

  const mutationContext = optimisticResult;

  return new Promise<RequestResponseType<Request>>((resolve) => {
    let isResolved = false;
    const requestId = dispatcher.add(request);
    const { $hooks } = request;
    const beforeSentData = { requestId, request, mutationContext };
    options?.onBeforeSent?.(beforeSentData);
    $hooks.__emit("onBeforeSent", beforeSentData);

    const unmountRequestStart = requestManager.events.onRequestStartById<Request>(requestId, (data) => {
      const enriched = { ...data, mutationContext };
      options?.onRequestStart?.(enriched);
      $hooks.__emit("onRequestStart", enriched);
    });

    const unmountResponseStart = requestManager.events.onResponseStartById<Request>(requestId, (data) => {
      const enriched = { ...data, mutationContext };
      options?.onResponseStart?.(enriched);
      $hooks.__emit("onResponseStart", enriched);
    });

    const unmountUpload = requestManager.events.onUploadProgressById<Request>(requestId, (data) => {
      const enriched = { ...data, mutationContext };
      options?.onUploadProgress?.(enriched);
      $hooks.__emit("onUploadProgress", enriched);
    });

    const unmountDownload = requestManager.events.onDownloadProgressById<Request>(requestId, (data) => {
      const enriched = { ...data, mutationContext };
      options?.onDownloadProgress?.(enriched);
      $hooks.__emit("onDownloadProgress", enriched);
    });

    // When resolved
    const unmountResponse = requestManager.events.onResponseById<Request>(requestId, (values) => {
      const { details, response } = values;
      isResolved = true;
      const enrichedValues = { ...values, mutationContext };

      const mapping = request.unstable_responseMapper?.(
        response as ResponseType<any, any, ExtractAdapterType<Request>>,
      );

      const isOfflineStatus = request.offline && details.isOffline;
      const { willRetry } = details;

      const handleResponse = (success: boolean, data: ResponseType<any, any, ExtractAdapterType<Request>>) => {
        // When going offline we can't handle the request as it will be postponed to later resolve
        if (!success && isOfflineStatus) return;

        // When request is in retry mode we need to listen for retries end
        if (!success && willRetry) return;

        options?.onResponse?.(enrichedValues);
        $hooks.__emit("onResponse", enrichedValues);
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
        handleResponse(success, data as ResponseType<any, any, ExtractAdapterType<Request>>);
      }
    });

    // When removed from queue storage we need to clean event listeners and return proper error
    const unmountRemoveQueueElement = requestManager.events.onRemoveById<Request>(requestId, (data) => {
      if (!isResolved) {
        const enriched = { ...data, mutationContext };
        options?.onRemove?.(enriched);
        $hooks.__emit("onRemove", enriched);
        resolve({
          data: null,
          status: null,
          success: false,
          error: getErrorMessage("deleted") as unknown as ExtractErrorType<Request>,
          extra: request.client.adapter.defaultExtra,
          requestTimestamp: +new Date(),
          responseTimestamp: +new Date(),
        });

        // Unmount Listeners
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        umountAll();
      }
    });

    function umountAll() {
      unmountRequestStart();
      unmountResponseStart();
      unmountUpload();
      unmountDownload();
      unmountResponse();
      unmountRemoveQueueElement();
    }
  });
};
