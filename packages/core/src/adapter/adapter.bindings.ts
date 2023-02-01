import { getErrorMessage, ResponseSuccessType, ResponseErrorType, ProgressDataType } from "adapter";
import { RequestInstance, getProgressData, AdapterProgressEventType } from "request";
import { ExtractResponseType, ExtractErrorType } from "types";

export const getAdapterBindings = async <ConfigType = any>(cmd: RequestInstance, requestId: string) => {
  const { url, requestManager, loggerManager, headerMapper, payloadMapper } = cmd.client;

  const logger = loggerManager.init("Adapter");

  let requestStartTimestamp: null | number = null;
  let responseStartTimestamp: null | number = null;
  let request = cmd;

  // Progress
  let requestTotal = 1;
  let responseTotal = 1;
  let previousRequestTotal = 0;
  let previousResponseTotal = 0;

  // Pre request modifications
  logger.debug(`Starting request middleware callbacks`);

  request = await request.client.__modifyRequest(cmd);

  if (request.auth) {
    request = await request.client.__modifyAuth(cmd);
  }

  // Request Setup
  const { client, abortKey, queueKey, endpoint, data } = request;

  // requestManager.addAbortController(abortKey, requestId);

  const fullUrl = url + endpoint;
  const effects = client.effects.filter((effect) => request.effectKey === effect.getEffectKey());
  const headers = headerMapper(request);
  const payload = payloadMapper(data);
  const config: ConfigType = { ...request.requestOptions.options };

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
    // requestManager.removeAbortController(abortKey, requestId);
    handleResponseProgress(responseStartTimestamp, progressTimestamp, {
      total: responseTotal,
      loaded: responseTotal,
    });
    return progressTimestamp;
  };

  // Success

  const onSuccess = async <T extends RequestInstance>(
    responseData: unknown,
    status: number,
    resolve: (value: ResponseErrorType<ExtractErrorType<T>>) => void,
  ): Promise<ResponseSuccessType<ExtractResponseType<T>>> => {
    let response = [responseData, null, status] as ResponseSuccessType<ExtractResponseType<T>>;
    response = await request.client.__modifyResponse(response, request);
    response = await request.client.__modifySuccessResponse(response, request);

    effects.forEach((effect) => effect.onSuccess(response, request));
    effects.forEach((effect) => effect.onFinished(response, request));

    resolve(response);

    return response;
  };

  // Errors

  const onError = async <T extends RequestInstance>(
    error: Error | ExtractErrorType<T>,
    status: number,
    resolve: (value: ResponseErrorType<ExtractErrorType<T>>) => void,
  ): Promise<ResponseErrorType<ExtractErrorType<T>>> => {
    let responseData = [null, error, status] as ResponseErrorType<ExtractErrorType<T>>;

    responseData = await request.client.__modifyResponse(responseData, request);
    responseData = await request.client.__modifyErrorResponse(responseData, request);

    effects.forEach((effect) => effect.onError(responseData, request));
    effects.forEach((effect) => effect.onFinished(responseData, request));

    resolve(responseData);

    return responseData;
  };

  const onAbortError = <T extends RequestInstance>(
    resolve: (value: ResponseErrorType<ExtractErrorType<T>>) => void,
  ) => {
    const error = getErrorMessage("abort");
    return onError(error, 0, resolve);
  };

  const onTimeoutError = <T extends RequestInstance>(
    resolve: (value: ResponseErrorType<ExtractErrorType<T>>) => void,
  ) => {
    const error = getErrorMessage("timeout");
    return onError(error, 0, resolve);
  };

  const onUnexpectedError = <T extends RequestInstance>(
    resolve: (value: ResponseErrorType<ExtractErrorType<T>>) => void,
  ) => {
    const error = getErrorMessage();
    return onError(error, 0, resolve);
  };

  // Abort

  const getAbortController = () => {
    return requestManager.getAbortController(abortKey, requestId);
  };

  const createAbortListener = <T extends RequestInstance>(
    callback: () => void,
    resolve: (value: ResponseErrorType<ExtractErrorType<T>>) => void,
  ) => {
    const controller = getAbortController();
    if (!controller) {
      throw new Error("Controller is not found");
    }

    const fn = () => {
      onAbortError(resolve);
      callback();
      requestManager.events.emitAbort(abortKey, requestId, request);
    };

    controller.signal.addEventListener("abort", fn);

    return () => controller.signal.removeEventListener("abort", fn);
  };

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
  };
};
