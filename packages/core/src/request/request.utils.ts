import { ProgressType, ResponseReturnType, getErrorMessage } from "adapter";
import { AdapterProgressEventType, RequestInstance, RequestDump, RequestSendOptionsType } from "request";
import { HttpMethodsEnum } from "constants/http.constants";
import { canRetryRequest, Dispatcher, isFailedRequest } from "dispatcher";
import { ExtractAdapterType, ExtractErrorType, ExtractResponseType } from "types";

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

export const getProgressValue = ({ loaded, total }: AdapterProgressEventType): number => {
  if (!loaded || !total) return 0;
  return Number(((loaded * 100) / total).toFixed(0));
};

export const getRequestEta = (
  startDate: Date,
  progressDate: Date,
  { total, loaded }: AdapterProgressEventType,
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
  progressEvent: AdapterProgressEventType,
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
export const getSimpleKey = (request: RequestInstance | RequestDump<RequestInstance>): string => {
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
  request: RequestInstance | RequestDump<RequestInstance>,
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

  return `${methodKey}_${endpointKey}`;
};

export const getRequestDispatcher = <Request extends RequestInstance>(
  request: Request,
  dispatcherType: "auto" | "fetch" | "submit" = "auto",
): [Dispatcher, boolean] => {
  const { fetchDispatcher, submitDispatcher } = request.client;
  const isGet = request.method === HttpMethodsEnum.get;
  const isFetchDispatcher = (dispatcherType === "auto" && isGet) || dispatcherType === "fetch";
  const dispatcher = isFetchDispatcher ? fetchDispatcher : submitDispatcher;

  return [dispatcher, isFetchDispatcher];
};

export const sendRequest = <Request extends RequestInstance>(
  request: Request,
  options?: RequestSendOptionsType<Request>,
) => {
  const { requestManager } = request.client;
  const [dispatcher] = getRequestDispatcher(request, options?.dispatcherType);

  return new Promise<
    ResponseReturnType<ExtractResponseType<Request>, ExtractErrorType<Request>, ExtractAdapterType<Request>>
  >((resolve) => {
    const requestId = dispatcher.add(request);
    options?.onSettle?.(requestId, request);

    const unmountRequestStart = requestManager.events.onRequestStartById<Request>(requestId, (...props) =>
      options?.onRequestStart?.(...props),
    );

    const unmountResponseStart = requestManager.events.onResponseStartById<Request>(requestId, (...props) =>
      options?.onResponseStart?.(...props),
    );

    const unmountUpload = requestManager.events.onUploadProgressById<Request>(requestId, (...props) =>
      options?.onUploadProgress?.(...props),
    );

    const unmountDownload = requestManager.events.onDownloadProgressById<Request>(requestId, (...props) =>
      options?.onDownloadProgress?.(...props),
    );

    // When resolved
    const unmountResponse = requestManager.events.onResponseById<
      ExtractResponseType<Request>,
      ExtractErrorType<Request>,
      ExtractAdapterType<Request>
    >(requestId, (response, details) => {
      const isFailed = isFailedRequest(response);
      const isOfflineStatus = request.offline && details.isOffline;
      const willRetry = canRetryRequest(details.retries, request.retry);

      // When going offline we can't handle the request as it will be postponed to later resolve
      if (isFailed && isOfflineStatus) return;

      // When request is in retry mode we need to listen for retries end
      if (isFailed && willRetry) return;

      options?.onResponse?.(response, details);
      resolve(response);

      // Unmount Listeners
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      umountAll();
    });

    // When removed from queue storage we need to clean event listeners and return proper error
    const unmountRemoveQueueElement = requestManager.events.onRemoveById<Request>(requestId, (...props) => {
      options.onRemove?.(...props);
      resolve({
        data: null,
        status: null,
        error: getErrorMessage("deleted") as unknown as ExtractErrorType<Request>,
        additionalData: request.client.defaultAdditionalData,
      });

      // Unmount Listeners
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      umountAll();
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
