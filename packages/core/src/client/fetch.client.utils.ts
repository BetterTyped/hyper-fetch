import { CommandInstance } from "command";
import { ExtractError } from "types";
import { getClientBindings, ClientResponseErrorType } from "client";

// Utils

export const getRequestConfig = <T extends Record<string, unknown> = Record<string, unknown>>(
  command: CommandInstance,
): T => {
  return { ...command.builder.requestConfig, ...command.commandOptions.options };
};

export const getErrorMessage = (errorCase?: "timeout" | "abort" | "deleted") => {
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

export const parseErrorResponse = <T extends CommandInstance>(response: unknown): ExtractError<T> => {
  return response ? parseResponse(response) : getErrorMessage();
};

export const handleReadyStateChange = (
  {
    onError,
    onResponseEnd,
    onSuccess,
  }: Pick<Awaited<ReturnType<typeof getClientBindings>>, "onError" | "onResponseEnd" | "onSuccess">,
  resolve: (value: ClientResponseErrorType<unknown>) => void,
) => {
  return (e: Event) => {
    const event = e as unknown as ProgressEvent<XMLHttpRequest>;
    const finishedState = 4;

    if (event.target && event.target.readyState === finishedState) {
      const { status } = event.target;
      const isSuccess = String(status).startsWith("2") || String(status).startsWith("3");
      onResponseEnd();

      if (isSuccess) {
        const data = parseResponse(event.target.response);
        onSuccess(data, status, resolve);
      } else {
        const data = parseErrorResponse(event.target.response);
        onError(data, status, resolve);
      }
    }
  };
};

// Progress

export const handleProgress = (
  onProgress:
    | Awaited<ReturnType<typeof getClientBindings>>["onResponseProgress"]
    | Awaited<ReturnType<typeof getClientBindings>>["onRequestProgress"],
) => {
  return (e: ProgressEvent<EventTarget>) => {
    const event = e as ProgressEvent<XMLHttpRequest>;
    const progress = {
      total: event.total,
      loaded: event.loaded,
    };
    onProgress(progress);
  };
};

// Error

export const handleError = (
  { onError, onUnexpectedError }: Pick<Awaited<ReturnType<typeof getClientBindings>>, "onError" | "onUnexpectedError">,
  resolve: (value: ClientResponseErrorType<unknown>) => void,
) => {
  return (e: ProgressEvent<EventTarget>) => {
    const event = e as ProgressEvent<XMLHttpRequest>;
    if (event.target) {
      const data = parseErrorResponse(event.target.response);
      onError(data, event.target.status, resolve);
    } else {
      onUnexpectedError();
    }
  };
};
