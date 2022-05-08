import {
  getErrorMessage,
  getRequestConfig,
  setRequestProgress,
  setResponseProgress,
  ClientResponseSuccessType,
  ClientResponseErrorType,
  ProgressPayloadType,
} from "client";
import { FetchCommandInstance } from "command";
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

  const fullUrl = baseUrl + endpoint + stringifyQueryParams(queryParams);
  const effects = builder.effects.filter((effect) => command.effects.includes(effect.getName()));
  const abortController = commandManager.getAbortController(abortKey, requestId);
  const headers = headerMapper(command);
  const payload = payloadMapper(data);
  const config = getRequestConfig(command);

  // Pre-request

  const onBeforeRequest = () => {
    effects.forEach((effect) => effect.onTrigger(command));
  };

  // Request

  const onRequestStart = (progress?: ProgressPayloadType) => {
    effects.forEach((action) => action.onStart(command));

    if (progress) {
      requestTotal = progress.total;
    }

    requestStartTimestamp = +new Date();
    const initialPayload = {
      total: requestTotal,
      loaded: progress?.loaded || 0,
    };
    setRequestProgress(queueKey, requestId, command, requestStartTimestamp, initialPayload);
    commandManager.events.emitRequestStart(queueKey, { requestId, command });
  };

  const onRequestProgress = (progress: ProgressPayloadType) => {
    if (!requestStartTimestamp) {
      requestStartTimestamp = +new Date();
    }
    requestTotal = progress.total;

    setRequestProgress(queueKey, requestId, command, requestStartTimestamp, progress);
  };

  const onRequestEnd = () => {
    if (!requestStartTimestamp) {
      requestStartTimestamp = +new Date();
    }

    setRequestProgress(queueKey, requestId, command, requestStartTimestamp, {
      total: requestTotal,
      loaded: requestTotal,
    });
  };

  // Response

  const onResponseStart = (progress?: ProgressPayloadType) => {
    responseStartTimestamp = +new Date();

    if (progress) {
      responseTotal = progress.total;
    }

    const initialPayload = {
      total: responseTotal,
      loaded: progress?.loaded || 0,
    };
    setResponseProgress(queueKey, requestId, command, responseStartTimestamp, initialPayload);
    commandManager.events.emitResponseStart(queueKey, { requestId, command });
  };

  const onResponseProgress = (progress: ProgressPayloadType) => {
    if (!responseStartTimestamp) {
      responseStartTimestamp = +new Date();
    }

    responseTotal = progress.total;

    setResponseProgress(queueKey, requestId, command, responseStartTimestamp, progress);
  };

  const onResponseEnd = () => {
    if (!responseStartTimestamp) {
      responseStartTimestamp = +new Date();
    }
    setResponseProgress(queueKey, requestId, command, responseStartTimestamp, {
      total: responseTotal,
      loaded: responseTotal,
    });
  };

  // Success

  const onSuccess = async <T extends FetchCommandInstance>(
    response: unknown,
    status: number,
    callback?: (value: ClientResponseSuccessType<ExtractResponse<T>>) => void,
  ): Promise<ClientResponseSuccessType<ExtractResponse<T>>> => {
    let responseData = [response, null, status] as ClientResponseSuccessType<ExtractResponse<T>>;
    command.builder.loggerManager.init("Client").http(`Success response`, { response: responseData });

    effects.forEach((effect) => effect.onSuccess(responseData, command));
    effects.forEach((effect) => effect.onFinished(responseData, command));

    responseData = await command.builder.__modifySuccessResponse(responseData, command);
    responseData = await command.builder.__modifyResponse(responseData, command);

    callback?.(responseData);

    return responseData;
  };

  // Errors

  const onError = async <T extends FetchCommandInstance>(
    error: Error | ExtractError<T>,
    status: number,
    callback?: (value: ClientResponseErrorType<ExtractError<T>>) => void,
  ): Promise<ClientResponseErrorType<ExtractError<T>>> => {
    let responseData = [null, error, status] as ClientResponseErrorType<ExtractError<T>>;
    command.builder.loggerManager.init("Client").http(`Error response`, { response: responseData });

    effects.forEach((effect) => effect.onError(responseData, command));
    effects.forEach((effect) => effect.onFinished(responseData, command));

    responseData = await command.builder.__modifyErrorResponse(responseData, command);
    responseData = await command.builder.__modifyResponse(responseData, command);

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
    abortController,
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
