import {
  getErrorMessage,
  ResponseReturnSuccessType,
  ResponseReturnErrorType,
  ProgressDataType,
  ExtractAdapterOptions,
  ExtractAdapterStatusType,
  ExtractAdapterAdditionalDataType,
  BaseAdapterType,
  AdapterInstance,
  ResponseReturnType,
} from "adapter";
import { RequestInstance, getProgressData, AdapterProgressEventType } from "request";
import { ExtractResponseType, ExtractErrorType, ExtractPayloadType } from "types";

export const getAdapterBindings = async <
  R extends RequestInstance = RequestInstance,
  T extends AdapterInstance = BaseAdapterType,
>(
  req: R,
  requestId: string,
  systemErrorStatus: ExtractAdapterStatusType<T>,
  systemErrorAdditionalData: ExtractAdapterAdditionalDataType<T>,
) => {
  const { url, requestManager, loggerManager, headerMapper, payloadMapper } = req.client;

  const logger = loggerManager.init("Adapter");

  let processingError = null;

  let requestStartTimestamp: null | number = null;
  let responseStartTimestamp: null | number = null;
  let request = req;

  // Progress
  let requestTotal = 1;
  let responseTotal = 1;
  let previousRequestTotal = 0;
  let previousResponseTotal = 0;

  // Pre request modifications
  logger.debug(`Starting request middleware callbacks`);

  try {
    request = (await request.client.__modifyRequest(req)) as R;

    if (request.auth) {
      request = (await request.client.__modifyAuth(req)) as R;
    }

    if (request.requestMapper) {
      request = request.requestMapper(requestId, request);
    }
  } catch (err) {
    processingError = err;
  }

  // Request Setup
  const { client, abortKey, queueKey, endpoint, data } = request;

  const fullUrl = url + endpoint;
  const effects = client.effects.filter((effect) => request.effectKey === effect.getEffectKey());
  const headers = headerMapper(request);
  let payload = data;

  try {
    payload = payloadMapper(data);
    if (request.dataMapper) {
      payload = request.dataMapper<ExtractPayloadType<R>>(data);
    }
  } catch (err) {
    processingError = err;
  }

  const config: ExtractAdapterOptions<T> = {
    ...request.requestOptions.options,
  } as ExtractAdapterOptions<T>;

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
    progressEvent: AdapterProgressEventType,
  ) => {
    const progress = getProgressData(new Date(startTimestamp), new Date(progressTimestamp), progressEvent);

    if (previousRequestTotal !== 100) {
      previousRequestTotal = progress.total;
      requestManager.events.emitUploadProgress(queueKey, requestId, progress, { requestId, request });
    }
  };

  const handleResponseProgress = (
    startTimestamp: number,
    progressTimestamp: number,
    progressEvent: AdapterProgressEventType,
  ) => {
    const progress = getProgressData(new Date(startTimestamp), new Date(progressTimestamp), progressEvent);

    if (previousResponseTotal !== 100) {
      previousResponseTotal = progress.total;
      requestManager.events.emitDownloadProgress(queueKey, requestId, progress, { requestId, request });
    }
  };

  // Pre-request

  const onBeforeRequest = () => {
    effects.forEach((effect) => effect.onTrigger(request));
  };

  // Request

  const onRequestStart = (progress?: ProgressDataType) => {
    effects.forEach((action) => action.onStart(request));

    if (progress?.total) {
      requestTotal = getTotal(requestTotal, progress);
    }

    const initialPayload = {
      total: requestTotal,
      loaded: progress?.loaded || 0,
    };
    requestStartTimestamp = +new Date();
    handleRequestProgress(requestStartTimestamp, requestStartTimestamp, initialPayload);
    requestManager.events.emitRequestStart(queueKey, requestId, { requestId, request });
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
    requestManager.events.emitResponseStart(queueKey, requestId, { requestId, request });
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

  const isSuccessfulResponse = (status: ExtractAdapterStatusType<T>) => {
    if (!status || status >= 400) {
      return false;
    }
    return true;
  };

  // Success

  const onSuccess = async (
    responseData: any,
    status: ExtractAdapterStatusType<T>,
    additionalData: ExtractAdapterAdditionalDataType<T>,
    resolve: (value: ResponseReturnErrorType<any, T>) => void,
  ): Promise<ResponseReturnSuccessType<ExtractResponseType<T>, T>> => {
    let response = {
      data: responseData,
      error: null,
      isSuccess: isSuccessfulResponse(status),
      status,
      additionalData,
    };
    response = await request.client.__modifyResponse(response, request);
    response = await request.client.__modifySuccessResponse(response, request);
    if (request.responseMapper) {
      response = await request.responseMapper(response, requestId, request);
    }

    effects.forEach((effect) => effect.onSuccess(response, request));
    effects.forEach((effect) => effect.onFinished(response, request));

    resolve(response);

    return response;
  };

  // Errors

  const onError = async (
    error: any,
    status: ExtractAdapterStatusType<T>,
    additionalData: ExtractAdapterAdditionalDataType<T>,
    resolve: (value: ResponseReturnErrorType<any, T>) => void,
  ): Promise<ResponseReturnErrorType<any, T>> => {
    let responseData = {
      data: null,
      status,
      error,
      isSuccess: isSuccessfulResponse(status),
      additionalData,
    } as ResponseReturnErrorType<any, T>;

    responseData = await request.client.__modifyResponse(responseData, request);
    responseData = await request.client.__modifyErrorResponse(responseData, request);
    if (request.responseMapper) {
      responseData = await request.responseMapper(responseData, requestId, request);
    }

    effects.forEach((effect) => effect.onError(responseData, request));
    effects.forEach((effect) => effect.onFinished(responseData, request));

    resolve(responseData);

    return responseData;
  };

  const onAbortError = (
    status: ExtractAdapterStatusType<T>,
    additionalData: ExtractAdapterAdditionalDataType<T>,
    resolve: (value: ResponseReturnErrorType<ExtractErrorType<T>, T>) => void,
  ) => {
    const error = getErrorMessage("abort");
    return onError(error, status, additionalData, resolve);
  };

  const onTimeoutError = (
    status: ExtractAdapterStatusType<T>,
    additionalData: ExtractAdapterAdditionalDataType<T>,
    resolve: (value: ResponseReturnErrorType<ExtractErrorType<T>, T>) => void,
  ) => {
    const error = getErrorMessage("timeout");
    return onError(error, status, additionalData, resolve);
  };

  const onUnexpectedError = (
    status: ExtractAdapterStatusType<T>,
    additionalData: ExtractAdapterAdditionalDataType<T>,
    resolve: (value: ResponseReturnErrorType<ExtractErrorType<T>, T>) => void,
  ) => {
    const error = getErrorMessage();
    return onError(error, status, additionalData, resolve);
  };

  // Abort

  const getAbortController = () => {
    return requestManager.getAbortController(abortKey, requestId);
  };

  const createAbortListener = (
    status: ExtractAdapterStatusType<T>,
    abortAdditionalData: ExtractAdapterAdditionalDataType<T>,
    callback: () => void,
    resolve: (value: ResponseReturnErrorType<ExtractErrorType<T>, T>) => void,
  ) => {
    const controller = getAbortController();
    if (!controller) {
      throw new Error("Controller is not found");
    }

    const fn = () => {
      onAbortError(status, abortAdditionalData, resolve);
      callback();
      requestManager.events.emitAbort(abortKey, requestId, request);
    };

    // Instant abort when we stack many requests triggered at once, and we receive aborted controller
    if (controller.signal.aborted) {
      fn();
    }

    // Abort during the request
    controller.signal.addEventListener("abort", fn);

    return () => controller.signal.removeEventListener("abort", fn);
  };

  const requestWrapper = (
    promise: () => Promise<ResponseReturnType<ExtractResponseType<R>, ExtractErrorType<R>, T>>,
  ): Promise<ResponseReturnType<ExtractResponseType<R>, ExtractErrorType<R>, T>> => {
    if (processingError) {
      return onError(processingError, systemErrorStatus, systemErrorAdditionalData, () => null);
    }
    return promise();
  };

  return {
    fullUrl,
    data,
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
    requestWrapper,
  };
};
