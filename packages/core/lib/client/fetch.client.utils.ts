import { ClientProgressEvent, FetchCommandInstance, getProgressData } from "command";
import { ExtractError } from "types";

// Utils

export const getRequestConfig = <T extends Record<string, unknown> = Record<string, unknown>>(
  command: FetchCommandInstance,
): T => {
  return { ...command.builder.requestConfig, ...command.commandOptions.options };
};

export const getErrorMessage = (errorCase?: "timeout" | "abort") => {
  if (errorCase === "timeout") {
    return new Error("Request timeout");
  }
  if (errorCase === "abort") {
    return new Error("Request cancelled");
  }
  return new Error("Unexpected error");
};

// Responses

export const parseResponse = (response: string | unknown) => {
  try {
    return JSON.parse(response as string);
  } catch (err) {
    return response;
  }
};

export const parseErrorResponse = <T extends FetchCommandInstance>(response: unknown): ExtractError<T> => {
  return response ? parseResponse(response) : getErrorMessage();
};

// Progress

export const handleResponseProgressEvents = <T extends FetchCommandInstance>(
  requestId: string,
  command: T,
  startTimestamp: number,
  progressTimestamp: number,
  event: ClientProgressEvent,
): void => {
  const progress = getProgressData(new Date(startTimestamp), new Date(progressTimestamp), event);

  command.builder.commandManager.events.emitDownloadProgress(command.queueKey, progress, { requestId, command });
};

export const handleRequestProgressEvents = <T extends FetchCommandInstance>(
  requestId: string,
  command: T,
  startTimestamp: number,
  progressTimestamp: number,
  event: ClientProgressEvent,
): void => {
  const progress = getProgressData(new Date(startTimestamp), new Date(progressTimestamp), event);

  command.builder.commandManager.events.emitUploadProgress(command.queueKey, progress, { requestId, command });
};
