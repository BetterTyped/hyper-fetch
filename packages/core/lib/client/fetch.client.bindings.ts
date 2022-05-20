import {
  getErrorMessage,
  getRequestConfig,
  ClientResponseSuccessType,
  ClientResponseErrorType,
  ProgressPayloadType,
} from "client";
import { FetchCommandInstance, getProgressData, ClientProgressEvent } from "command";
import { ExtractResponse, ExtractError } from "types";

export const getClientBindings = async (cmd: FetchCommandInstance, requestId: string) => {
  const { baseUrl, commandManager, loggerManager, stringifyQueryParams, headerMapper, payloadMapper } = cmd.builder;

  const logger = loggerManager.init("Client");

  let requestStartTimestamp: null | number = null;
  let responseStartTimestamp: null | number = null;
  let requestTotal = 1;
  let responseTotal = 1;
  let command = cmd;

  // Pre request modifications
  logger.debug(`Starting command middleware callbacks`);

  command = await command.builder.__modifyRequest(cmd);

  if (command.auth) {
    command = await command.builder.__modifyAuth(cmd);
  }

  // Command Setup
  const { builder, abortKey, queueKey, endpoint, queryParams, data } = command;

  commandManager.addAbortController(abortKey, requestId);

  const fullUrl = baseUrl + endpoint + stringifyQueryParams(queryParams);
  const effects = builder.effects.filter((effect) => command.effectKey === effect.getEffectKey());
  const headers = headerMapper(command);
  const payload = payloadMapper(data);
  const config = getRequestConfig(command);

  const getRequestStartTimestamp = () => {
    return requestStartTimestamp;
  };

  const getResponseStartTimestamp = () => {
    return responseStartTimestamp;
  };

  // Abort

  const getAbortController = () => {
    return commandManager.getAbortController(abortKey, requestId);
  };

  const createAbortListener = (callback: () => void) => {
    const controller = getAbortController();
    if (!controller) {
      throw new Error("Controller is not found");
    }

    controller.signal.addEventListener("abort", callback);

    return () => controller.signal.removeEventListener("abort", callback);
  };

  const unmountEmitter = createAbortListener(() => {
    commandManager.events.emitAbort(abortKey, requestId, command);
  });

  // Progress

  const handleRequestProgress = (
    startTimestamp: number,
    progressTimestamp: number,
    progressEvent: ClientProgressEvent,
  ) => {
    const progress = getProgressData(new Date(startTimestamp), new Date(progressTimestamp), progressEvent);
    commandManager.events.emitUploadProgress(queueKey, requestId, progress, { requestId, command });
  };

  const handleResponseProgress = (
    startTimestamp: number,
    progressTimestamp: number,
    progressEvent: ClientProgressEvent,
  ) => {
    const progress = getProgressData(new Date(startTimestamp), new Date(progressTimestamp), progressEvent);
    commandManager.events.emitDownloadProgress(queueKey, requestId, progress, { requestId, command });
  };

  // Pre-request

  const onBeforeRequest = () => {
    effects.forEach((effect) => effect.onTrigger(command));
  };

  // Request

  const onRequestStart = (progress?: ProgressPayloadType) => {
    effects.forEach((action) => action.onStart(command));

    if (progress?.total) {
      requestTotal = progress.total;
    }

    const initialPayload = {
      total: requestTotal,
      loaded: progress?.loaded || 0,
    };
    requestStartTimestamp = +new Date();
    handleRequestProgress(requestStartTimestamp, requestStartTimestamp, initialPayload);
    commandManager.events.emitRequestStart(queueKey, requestId, { requestId, command });
    return requestStartTimestamp;
  };

  const onRequestProgress = (progress: ProgressPayloadType) => {
    if (!requestStartTimestamp) {
      requestStartTimestamp = +new Date();
    }
    requestTotal = progress.total;

    const progressTimestamp = +new Date();

    handleRequestProgress(requestStartTimestamp, progressTimestamp, progress);
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

  const onResponseStart = (progress?: ProgressPayloadType) => {
    responseStartTimestamp = +new Date();

    if (progress?.total) {
      responseTotal = progress.total;
    }

    const initialPayload = {
      total: responseTotal,
      loaded: progress?.loaded || 0,
    };

    handleResponseProgress(responseStartTimestamp, responseStartTimestamp, initialPayload);
    commandManager.events.emitResponseStart(queueKey, requestId, { requestId, command });
    return responseStartTimestamp;
  };

  const onResponseProgress = (progress: ProgressPayloadType) => {
    if (!responseStartTimestamp) {
      responseStartTimestamp = +new Date();
    }

    const progressTimestamp = +new Date();
    responseTotal = progress.total;
    handleResponseProgress(responseStartTimestamp, progressTimestamp, progress);
    return progressTimestamp;
  };

  const onResponseEnd = () => {
    if (!responseStartTimestamp) {
      responseStartTimestamp = +new Date();
    }

    const progressTimestamp = +new Date();
    commandManager.removeAbortController(abortKey, requestId);
    handleResponseProgress(responseStartTimestamp, progressTimestamp, {
      total: responseTotal,
      loaded: responseTotal,
    });
    unmountEmitter();
    return progressTimestamp;
  };

  // Success

  const onSuccess = async <T extends FetchCommandInstance>(
    responseData: unknown,
    status: number,
    callback?: (value: ClientResponseSuccessType<ExtractResponse<T>>) => void,
  ): Promise<ClientResponseSuccessType<ExtractResponse<T>>> => {
    let response = [responseData, null, status] as ClientResponseSuccessType<ExtractResponse<T>>;
    command.builder.loggerManager.init("Client").http(`Success response`, { response });

    response = await command.builder.__modifyResponse(response, command);
    response = await command.builder.__modifySuccessResponse(response, command);

    effects.forEach((effect) => effect.onSuccess(response, command));
    effects.forEach((effect) => effect.onFinished(response, command));

    callback?.(response);

    return response;
  };

  // Errors

  const onError = async <T extends FetchCommandInstance>(
    error: Error | ExtractError<T>,
    status: number,
    callback?: (value: ClientResponseErrorType<ExtractError<T>>) => void,
  ): Promise<ClientResponseErrorType<ExtractError<T>>> => {
    let responseData = [null, error, status] as ClientResponseErrorType<ExtractError<T>>;
    command.builder.loggerManager.init("Client").http(`Error response`, { response: responseData });

    responseData = await command.builder.__modifyResponse(responseData, command);
    responseData = await command.builder.__modifyErrorResponse(responseData, command);

    effects.forEach((effect) => effect.onError(responseData, command));
    effects.forEach((effect) => effect.onFinished(responseData, command));

    callback?.(responseData);

    return responseData;
  };

  const onAbortError = async () => {
    const error = getErrorMessage("abort");
    return onError(error, 0);
  };

  const onTimeoutError = async () => {
    const error = getErrorMessage("timeout");
    return onError(error, 0);
  };

  const onUnexpectedError = async () => {
    const error = getErrorMessage();
    return onError(error, 0);
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
