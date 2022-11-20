import { getErrorMessage, ClientResponseSuccessType, ClientResponseErrorType, ProgressRequestDataType } from "client";
import { CommandInstance, getProgressData, ClientProgressEvent } from "command";
import { ExtractResponse, ExtractError } from "types";

export const getClientBindings = async (cmd: CommandInstance, requestId: string) => {
  const { url, commandManager, loggerManager, headerMapper, payloadMapper } = cmd.builder;

  const logger = loggerManager.init("Client");

  let requestStartTimestamp: null | number = null;
  let responseStartTimestamp: null | number = null;
  let command = cmd;

  // Progress
  let requestTotal = 1;
  let responseTotal = 1;
  let previousRequestTotal = 0;
  let previousResponseTotal = 0;

  // Pre request modifications
  logger.debug(`Starting command middleware callbacks`);

  command = await command.builder.__modifyRequest(cmd);

  if (command.auth) {
    command = await command.builder.__modifyAuth(cmd);
  }

  // Command Setup
  const { builder, abortKey, queueKey, endpoint, data } = command;

  commandManager.addAbortController(abortKey, requestId);

  const fullUrl = url + endpoint;
  const effects = builder.effects.filter((effect) => command.effectKey === effect.getEffectKey());
  const headers = headerMapper(command);
  const payload = payloadMapper(data);
  const config = { ...command.commandOptions.options };

  const getRequestStartTimestamp = () => {
    return requestStartTimestamp;
  };

  const getResponseStartTimestamp = () => {
    return responseStartTimestamp;
  };

  // Progress

  const getTotal = (previousTotal: number, progress?: ProgressRequestDataType) => {
    if (!progress) return previousTotal;
    const total = Number(progress.total || 0);
    const loaded = Number(progress.loaded || 0);
    return Math.max(total, loaded, previousTotal);
  };

  const handleRequestProgress = (
    startTimestamp: number,
    progressTimestamp: number,
    progressEvent: ClientProgressEvent,
  ) => {
    const progress = getProgressData(new Date(startTimestamp), new Date(progressTimestamp), progressEvent);

    if (previousRequestTotal !== 100) {
      previousRequestTotal = progress.total;
      commandManager.events.emitUploadProgress(queueKey, requestId, progress, { requestId, command });
    }
  };

  const handleResponseProgress = (
    startTimestamp: number,
    progressTimestamp: number,
    progressEvent: ClientProgressEvent,
  ) => {
    const progress = getProgressData(new Date(startTimestamp), new Date(progressTimestamp), progressEvent);

    if (previousResponseTotal !== 100) {
      previousResponseTotal = progress.total;
      commandManager.events.emitDownloadProgress(queueKey, requestId, progress, { requestId, command });
    }
  };

  // Pre-request

  const onBeforeRequest = () => {
    effects.forEach((effect) => effect.onTrigger(command));
  };

  // Request

  const onRequestStart = (progress?: ProgressRequestDataType) => {
    effects.forEach((action) => action.onStart(command));

    if (progress?.total) {
      requestTotal = getTotal(requestTotal, progress);
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

  const onRequestProgress = (progress: ProgressRequestDataType) => {
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

  const onResponseStart = (progress?: ProgressRequestDataType) => {
    responseStartTimestamp = +new Date();

    responseTotal = getTotal(responseTotal, progress);

    const initialPayload = {
      total: responseTotal,
      loaded: progress?.loaded || 0,
    };

    handleResponseProgress(responseStartTimestamp, responseStartTimestamp, initialPayload);
    commandManager.events.emitResponseStart(queueKey, requestId, { requestId, command });
    return responseStartTimestamp;
  };

  const onResponseProgress = (progress: ProgressRequestDataType) => {
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
    commandManager.removeAbortController(abortKey, requestId);
    handleResponseProgress(responseStartTimestamp, progressTimestamp, {
      total: responseTotal,
      loaded: responseTotal,
    });
    return progressTimestamp;
  };

  // Success

  const onSuccess = async <T extends CommandInstance>(
    responseData: unknown,
    status: number,
    resolve: (value: ClientResponseErrorType<ExtractError<T>>) => void,
  ): Promise<ClientResponseSuccessType<ExtractResponse<T>>> => {
    let response = [responseData, null, status] as ClientResponseSuccessType<ExtractResponse<T>>;
    response = await command.builder.__modifyResponse(response, command);
    response = await command.builder.__modifySuccessResponse(response, command);

    effects.forEach((effect) => effect.onSuccess(response, command));
    effects.forEach((effect) => effect.onFinished(response, command));

    resolve(response);

    return response;
  };

  // Errors

  const onError = async <T extends CommandInstance>(
    error: Error | ExtractError<T>,
    status: number,
    resolve: (value: ClientResponseErrorType<ExtractError<T>>) => void,
  ): Promise<ClientResponseErrorType<ExtractError<T>>> => {
    let responseData = [null, error, status] as ClientResponseErrorType<ExtractError<T>>;

    responseData = await command.builder.__modifyResponse(responseData, command);
    responseData = await command.builder.__modifyErrorResponse(responseData, command);

    effects.forEach((effect) => effect.onError(responseData, command));
    effects.forEach((effect) => effect.onFinished(responseData, command));

    resolve(responseData);

    return responseData;
  };

  const onAbortError = <T extends CommandInstance>(
    resolve: (value: ClientResponseErrorType<ExtractError<T>>) => void,
  ) => {
    const error = getErrorMessage("abort");
    return onError(error, 0, resolve);
  };

  const onTimeoutError = <T extends CommandInstance>(
    resolve: (value: ClientResponseErrorType<ExtractError<T>>) => void,
  ) => {
    const error = getErrorMessage("timeout");
    return onError(error, 0, resolve);
  };

  const onUnexpectedError = <T extends CommandInstance>(
    resolve: (value: ClientResponseErrorType<ExtractError<T>>) => void,
  ) => {
    const error = getErrorMessage();
    return onError(error, 0, resolve);
  };

  // Abort

  const getAbortController = () => {
    return commandManager.getAbortController(abortKey, requestId);
  };

  const createAbortListener = <T extends CommandInstance>(
    callback: () => void,
    resolve: (value: ClientResponseErrorType<ExtractError<T>>) => void,
  ) => {
    const controller = getAbortController();
    if (!controller) {
      throw new Error("Controller is not found");
    }

    const fn = () => {
      callback();
      onAbortError(resolve);
      commandManager.events.emitAbort(abortKey, requestId, command);
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
