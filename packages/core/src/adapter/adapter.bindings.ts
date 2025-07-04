import {
  getErrorMessage,
  ResponseSuccessType,
  ResponseErrorType,
  ProgressDataType,
  AdapterInstance,
  RequestProcessingError,
} from "adapter";
import { LoggerMethods } from "managers";
import { RequestInstance, getProgressData, ProgressEventType } from "request";
import {
  ExtractResponseType,
  ExtractErrorType,
  ExtractPayloadType,
  ExtractAdapterOptionsType,
  ExtractAdapterStatusType,
  ExtractAdapterExtraType,
} from "types";

export const getAdapterBindings = async <T extends AdapterInstance>({
  request: baseRequest,
  requestId,
  resolve,
  onStartTime,
  internalErrorMapping,
}: {
  request: RequestInstance;
  requestId: string;
  resolve: (value: ResponseSuccessType<any, T> | ResponseErrorType<any, T>) => void;
  onStartTime: (timestamp: number) => void;
  internalErrorMapping: (error: ReturnType<typeof getErrorMessage>) => any;
}) => {
  const { requestManager, loggerManager } = baseRequest.client;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { unstable_payloadMapper } = baseRequest.client.adapter;

  const logger = loggerManager.initialize(baseRequest.client, "Adapter");

  let requestStartTimestamp: null | number = null;
  let responseStartTimestamp: null | number = null;
  let request = baseRequest;

  // Progress
  let requestTotal = 1;
  let responseTotal = 1;
  let previousRequestTotal = 0;
  let previousResponseTotal = 0;

  // Pre request modifications
  logger.debug({
    title: `Running middleware callbacks`,
    type: "request",
    extra: {
      request,
      requestId,
    },
  });

  request = await request.client.unstable_modifyRequest(request);

  if (request.auth) {
    request = await request.client.unstable_modifyAuth(request);
  }

  if (request.unstable_requestMapper) {
    request = await request.unstable_requestMapper(request, requestId);
  }

  // Request Setup
  const { client, abortKey } = request;

  // eslint-disable-next-line prefer-destructuring
  let payload = request.payload;

  if (request.unstable_payloadMapper) {
    payload = await request.unstable_payloadMapper<ExtractPayloadType<RequestInstance>>(request.payload);
  } else if (unstable_payloadMapper) {
    payload = await unstable_payloadMapper(payload);
  }

  const adapterOptions = request.options as ExtractAdapterOptionsType<T> | undefined;
  const startTime = +new Date();
  onStartTime(startTime);

  const getRequestStartTimestamp = () => {
    return requestStartTimestamp;
  };

  const getResponseStartTimestamp = () => {
    return responseStartTimestamp;
  };

  // Progress

  const getTotal = (previousTotal: number, progress?: ProgressDataType) => {
    if (!progress) return previousTotal;
    const total = Number(progress.total || 0);
    const loaded = Number(progress.loaded || 0);
    return Math.max(total, loaded, previousTotal);
  };

  const handleRequestProgress = (
    startTimestamp: number,
    progressTimestamp: number,
    progressEvent: ProgressEventType,
  ) => {
    const progress = getProgressData(new Date(startTimestamp), new Date(progressTimestamp), progressEvent);

    if (previousRequestTotal !== 100) {
      previousRequestTotal = progress.total;
      requestManager.events.emitUploadProgress({ ...progress, requestId, request });
    }
  };

  const handleResponseProgress = (
    startTimestamp: number,
    progressTimestamp: number,
    progressEvent: ProgressEventType,
  ) => {
    const progress = getProgressData(new Date(startTimestamp), new Date(progressTimestamp), progressEvent);

    if (previousResponseTotal !== 100) {
      previousResponseTotal = progress.total;
      requestManager.events.emitDownloadProgress({ ...progress, requestId, request });
    }
  };

  // Pre-request

  const onBeforeRequest = () => {
    logger.debug({
      title: `Request about to be sent`,
      type: "request",
      extra: {
        request,
        requestId,
      },
    });
    client.triggerPlugins("onRequestTrigger", { request });
  };

  // Request

  const onRequestStart = (progress?: ProgressDataType) => {
    logger.info({
      title: `Request start`,
      type: "request",
      extra: {
        request,
        requestId,
      },
    });
    client.triggerPlugins("onRequestStart", { request });

    if (progress?.total) {
      requestTotal = getTotal(requestTotal, progress);
    }

    const initialPayload = {
      total: requestTotal,
      loaded: progress?.loaded || 0,
    };
    requestStartTimestamp = +new Date();
    handleRequestProgress(requestStartTimestamp, requestStartTimestamp, initialPayload);
    requestManager.events.emitRequestStart({ requestId, request });
    return requestStartTimestamp;
  };

  const onRequestProgress = (progress: ProgressDataType) => {
    if (!requestStartTimestamp) {
      requestStartTimestamp = +new Date();
    }
    requestTotal = getTotal(requestTotal, progress);

    const progressTimestamp = +new Date();

    handleRequestProgress(requestStartTimestamp, progressTimestamp, {
      total: requestTotal,
      loaded: progress.loaded || 0,
    });
    return progressTimestamp;
  };

  const onRequestEnd = () => {
    if (!requestStartTimestamp) {
      requestStartTimestamp = +new Date();
    }

    const progressTimestamp = +new Date();
    handleRequestProgress(requestStartTimestamp, progressTimestamp, {
      total: requestTotal,
      loaded: requestTotal,
    });
    return progressTimestamp;
  };

  // Response

  const onResponseStart = (progress?: ProgressDataType) => {
    responseStartTimestamp = +new Date();

    responseTotal = getTotal(responseTotal, progress);

    const initialPayload = {
      total: responseTotal,
      loaded: progress?.loaded || 0,
    };

    handleResponseProgress(responseStartTimestamp, responseStartTimestamp, initialPayload);
    requestManager.events.emitResponseStart({ requestId, request });
    return responseStartTimestamp;
  };

  const onResponseProgress = (progress: ProgressDataType) => {
    if (!responseStartTimestamp) {
      responseStartTimestamp = +new Date();
    }

    const progressTimestamp = +new Date();
    responseTotal = getTotal(responseTotal, progress);

    handleResponseProgress(responseStartTimestamp, progressTimestamp, {
      total: progress.total || responseTotal,
      loaded: progress.loaded || 0,
    });
    return progressTimestamp;
  };

  const onResponseEnd = () => {
    if (!responseStartTimestamp) {
      responseStartTimestamp = +new Date();
    }

    const progressTimestamp = +new Date();
    handleResponseProgress(responseStartTimestamp, progressTimestamp, {
      total: responseTotal,
      loaded: responseTotal,
    });
    return progressTimestamp;
  };

  // Success

  const onSuccess = async ({
    data,
    error,
    status,
    extra,
  }: {
    data: any;
    status: ExtractAdapterStatusType<T>;
    extra: ExtractAdapterExtraType<T>;
    error?: ExtractErrorType<T>;
  }): Promise<ResponseSuccessType<ExtractResponseType<T>, T>> => {
    let response: ResponseSuccessType<ExtractResponseType<T>, T> = {
      data,
      error: error ?? null,
      success: true,
      status,
      extra,
      requestTimestamp: startTime,
      responseTimestamp: +new Date(),
    };
    response = (await request.client.unstable_modifyResponse?.(response, request)) as typeof data;
    response = (await request.client.unstable_modifySuccessResponse?.(response, request)) as typeof data;

    client.triggerPlugins("onRequestSuccess", { response, request });
    client.triggerPlugins("onRequestFinished", { response, request });

    resolve(response);

    logger.info({
      title: `Response success`,
      type: "response",
      extra: {
        request,
        requestId,
        response,
      },
    });
    return response;
  };

  // Errors

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const onError = getAdapterOnError({
    request,
    requestId,
    startTime,
    logger,
    resolve,
  });

  const onAbortError = ({
    status,
    extra,
  }: {
    status: ExtractAdapterStatusType<T>;
    extra: ExtractAdapterExtraType<T>;
  }) => {
    logger.error({
      title: `Abort error`,
      type: "request",
      extra: {
        request,
        requestId,
      },
    });
    const error = internalErrorMapping(getErrorMessage("abort"));
    return onError({ error, status, extra });
  };

  const onTimeoutError = ({
    status,
    extra,
  }: {
    status: ExtractAdapterStatusType<T>;
    extra: ExtractAdapterExtraType<T>;
  }) => {
    logger.error({
      title: `Timeout error`,
      type: "request",
      extra: {
        request,
        requestId,
      },
    });
    const error = getErrorMessage("timeout");
    return onError({ error, status, extra });
  };

  const onUnexpectedError = ({
    status,
    extra,
  }: {
    status: ExtractAdapterStatusType<T>;
    extra: ExtractAdapterExtraType<T>;
  }) => {
    logger.error({
      title: `Unexpected error`,
      type: "request",
      extra: {
        request,
        requestId,
      },
    });
    const error = getErrorMessage();
    return onError({ error, status, extra });
  };

  // Abort

  const getAbortController = () => {
    return requestManager.getAbortController(abortKey, requestId);
  };

  const createAbortListener = ({
    status,
    extra,
    onAbort = () => {},
  }: {
    status: ExtractAdapterStatusType<T>;
    extra: ExtractAdapterExtraType<T>;
    onAbort?: () => void;
  }) => {
    const controller = getAbortController();
    if (!controller) {
      throw new RequestProcessingError("Controller is not found");
    }

    const abort = () => {
      onAbortError({ status, extra });
      onAbort();
      requestManager.events.emitAbort({ requestId, request });
    };

    // Instant abort when we stack many requests triggered at once, and we receive aborted controller
    if (controller.signal.aborted) {
      abort();
    }

    // Abort during the request
    controller.signal.addEventListener("abort", abort);

    return () => controller.signal.removeEventListener("abort", abort);
  };

  logger.debug({
    title: `Mounted adapter bindings`,
    type: "request",
    extra: {
      request,
      requestId,
      payload,
      adapterOptions,
    },
  });

  const queryParams = baseRequest.client.adapter.unstable_queryParamsMapper(request.queryParams);
  const endpoint = baseRequest.client.adapter.unstable_endpointMapper(request.endpoint);
  const headers = baseRequest.client.adapter.unstable_headerMapper(request);
  const { url } = baseRequest.client;

  return {
    request,
    requestId,
    url,
    endpoint,
    queryParams,
    payload,
    headers,
    adapter: baseRequest.client.adapter,
    adapterOptions,
    getAbortController,
    getRequestStartTimestamp,
    getResponseStartTimestamp,
    createAbortListener,
    onBeforeRequest,
    onRequestStart,
    onRequestProgress,
    onRequestEnd,
    onResponseStart,
    onResponseProgress,
    onResponseEnd,
    onSuccess,
    onAbortError,
    onTimeoutError,
    onUnexpectedError,
    onError,
  };
};

export function getAdapterOnError<T extends AdapterInstance>({
  request,
  requestId,
  startTime,
  resolve,
  logger,
}: {
  request: RequestInstance;
  requestId: string;
  startTime: number;
  logger: LoggerMethods;
  resolve: (value: ResponseSuccessType<any, T> | ResponseErrorType<any, T>) => void;
}) {
  const { client } = request;

  return async ({
    error,
    status,
    extra,
  }: {
    error: any;
    status: ExtractAdapterStatusType<T>;
    extra: ExtractAdapterExtraType<T>;
  }): Promise<ResponseErrorType<any, T>> => {
    let response: ResponseErrorType<any, T> = {
      data: null,
      status,
      error,
      success: false,
      extra,
      requestTimestamp: startTime,
      responseTimestamp: +new Date(),
    };

    response = (await client.unstable_modifyResponse(response, request)) as typeof response;
    response = (await client.unstable_modifyErrorResponse(response, request)) as typeof response;

    client.triggerPlugins("onRequestError", { response, request });
    client.triggerPlugins("onRequestFinished", { response, request });

    resolve(response);

    logger.error({
      title: `Request error`,
      type: "request",
      extra: {
        request,
        requestId,
        response,
      },
    });

    return response;
  };
}
