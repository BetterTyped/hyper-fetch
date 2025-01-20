/* eslint-disable max-params */
import {
  getErrorMessage,
  ResponseSuccessType,
  ResponseErrorType,
  ProgressDataType,
  ExtractAdapterOptionsType,
  ExtractAdapterStatusType,
  ExtractAdapterExtraType,
  AdapterType,
  AdapterInstance,
  ResponseType,
} from "adapter";
import { RequestInstance, getProgressData, ProgressEventType } from "request";
import { ExtractResponseType, ExtractErrorType, ExtractPayloadType } from "types";
import { mocker } from "mocker";

export const getAdapterBindings = async <T extends AdapterInstance = AdapterType>({
  request: req,
  requestId,
  systemErrorStatus,
  systemErrorExtra,
  internalErrorFormatter,
}: {
  request: RequestInstance;
  requestId: string;
  systemErrorStatus: ExtractAdapterStatusType<T>;
  systemErrorExtra: ExtractAdapterExtraType<T>;
  internalErrorFormatter?: (error: Error) => any;
}) => {
  const { url, requestManager, loggerManager, headerMapper, payloadMapper } = req.client;

  const logger = loggerManager.initialize(req.client, "Adapter");

  let processingError: Error | null = null;

  let requestStartTimestamp: null | number = null;
  let responseStartTimestamp: null | number = null;
  let request = req;

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

  try {
    request = await request.client.__modifyRequest(req);

    if (request.auth) {
      request = await request.client.__modifyAuth(req);
    }

    if (request.__requestMapper) {
      request = await request.__requestMapper(request, requestId);
    }
  } catch (err) {
    processingError = err as Error;
  }

  // Request Setup
  const { client, abortKey, endpoint } = request;

  const fullUrl = url + endpoint;

  const headers = headerMapper(request);
  // eslint-disable-next-line prefer-destructuring
  let payload = request.payload;

  try {
    if (request.payloadMapper) {
      payload = await request.payloadMapper<ExtractPayloadType<RequestInstance>>(request.payload);
    } else if (payloadMapper) {
      payload = await payloadMapper(payload);
    }
  } catch (err) {
    processingError = err as Error;
  }

  const config = request.options as ExtractAdapterOptionsType<T> | undefined;
  const startTime = +new Date();

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

  const onSuccess = async (
    responseData: any,
    status: ExtractAdapterStatusType<T>,
    extra: ExtractAdapterExtraType<T>,
    resolve: (value: ResponseSuccessType<any, T>) => void,
  ): Promise<ResponseSuccessType<ExtractResponseType<T>, T>> => {
    let response: ResponseSuccessType<ExtractResponseType<T>, T> = {
      data: responseData,
      error: null,
      success: true,
      status,
      extra,
      requestTimestamp: startTime,
      responseTimestamp: +new Date(),
    };
    response = (await request.client.__modifyResponse(response, request)) as typeof responseData;
    response = (await request.client.__modifySuccessResponse(response, request)) as typeof responseData;

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

  const onError = async (
    error: any,
    status: ExtractAdapterStatusType<T>,
    extra: ExtractAdapterExtraType<T>,
    resolve: (value: ResponseErrorType<any, T>) => void,
  ): Promise<ResponseErrorType<any, T>> => {
    let response: ResponseErrorType<any, T> = {
      data: null,
      status,
      error,
      success: false,
      extra,
      requestTimestamp: startTime,
      responseTimestamp: +new Date(),
    };

    response = (await request.client.__modifyResponse(response, request)) as typeof response;
    response = (await request.client.__modifyErrorResponse(response, request)) as typeof response;

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

  const onAbortError = (
    status: ExtractAdapterStatusType<T>,
    extra: ExtractAdapterExtraType<T>,
    resolve: (value: ResponseErrorType<ExtractErrorType<T>, T>) => void,
  ) => {
    logger.error({
      title: `Abort error`,
      type: "request",
      extra: {
        request,
        requestId,
      },
    });
    const error = getErrorMessage("abort");
    if (internalErrorFormatter) {
      return onError(internalErrorFormatter(error), status, extra, resolve);
    }
    return onError(error, status, extra, resolve);
  };

  const onTimeoutError = (
    status: ExtractAdapterStatusType<T>,
    extra: ExtractAdapterExtraType<T>,
    resolve: (value: ResponseErrorType<ExtractErrorType<T>, T>) => void,
  ) => {
    logger.error({
      title: `Timeout error`,
      type: "request",
      extra: {
        request,
        requestId,
      },
    });
    const error = getErrorMessage("timeout");
    if (internalErrorFormatter) {
      return onError(internalErrorFormatter(error), status, extra, resolve);
    }
    return onError(error, status, extra, resolve);
  };

  const onUnexpectedError = (
    status: ExtractAdapterStatusType<T>,
    extra: ExtractAdapterExtraType<T>,
    resolve: (value: ResponseErrorType<ExtractErrorType<T>, T>) => void,
  ) => {
    logger.error({
      title: `Unexpected error`,
      type: "request",
      extra: {
        request,
        requestId,
      },
    });
    const error = getErrorMessage();
    if (internalErrorFormatter) {
      return onError(internalErrorFormatter(error), status, extra, resolve);
    }
    return onError(error, status, extra, resolve);
  };

  // Abort

  const getAbortController = () => {
    return requestManager.getAbortController(abortKey, requestId);
  };

  const createAbortListener = (
    status: ExtractAdapterStatusType<T>,
    abortExtra: ExtractAdapterExtraType<T>,
    callback: () => void,
    resolve: (value: ResponseErrorType<ExtractErrorType<T>, T>) => void,
  ) => {
    const controller = getAbortController();
    if (!controller) {
      throw new Error("Controller is not found");
    }

    const fn = () => {
      onAbortError(status, abortExtra, resolve);
      callback();
      requestManager.events.emitAbort({ requestId, request });
    };

    // Instant abort when we stack many requests triggered at once, and we receive aborted controller
    if (controller.signal.aborted) {
      fn();
    }

    // Abort during the request
    controller.signal.addEventListener("abort", fn);

    return () => controller.signal.removeEventListener("abort", fn);
  };

  const makeRequest = (
    apiCall: (resolve: (value: ResponseType<any, any, T> | PromiseLike<ResponseType<any, any, T>>) => void) => void,
  ): Promise<ResponseType<any, any, T>> => {
    if (processingError) {
      return onError(processingError, systemErrorStatus, systemErrorExtra, () => null);
    }

    if (req.mock && req.isMockEnabled && req.client.isMockEnabled) {
      return mocker(req, {
        onError,
        onResponseEnd,
        onTimeoutError,
        onRequestEnd,
        createAbortListener,
        onResponseProgress,
        onRequestProgress,
        onResponseStart,
        onBeforeRequest,
        onRequestStart,
        onSuccess,
      });
    }

    return new Promise(apiCall);
  };

  logger.debug({
    title: `Mounted adapter bindings`,
    type: "request",
    extra: {
      request,
      requestId,
      fullUrl,
      headers,
      payload,
      config,
    },
  });

  return {
    fullUrl,
    headers,
    payload,
    config,
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
    makeRequest,
  };
};
