import { DateInterval } from "constants/time.constants";
import { parseResponse, getClientBindings, parseErrorResponse } from "client";
import { ClientResponseType, ClientType } from "./fetch.client.types";

export const fetchClient: ClientType = async (command, requestId) => {
  if (!XMLHttpRequest) {
    throw new Error("There is no XMLHttpRequest, make sure it's provided to use React-Fetch built-in client.");
  }

  const {
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
  } = await getClientBindings(command, requestId);

  const { method } = command;

  const xhr = new XMLHttpRequest();
  xhr.timeout = DateInterval.second * 5;

  const abort = () => xhr.abort();

  return new Promise<ClientResponseType<unknown, unknown>>((resolve) => {
    // Inject xhr options
    Object.entries(config).forEach(([name, value]) => {
      // eslint-disable-next-line no-param-reassign
      (xhr as any)[name] = value;
    });

    // Open connection
    xhr.open(method, fullUrl, true);

    // Set Headers
    Object.entries(headers).forEach(([name, value]) => xhr.setRequestHeader(name, value));

    // Listen to abort signal
    abortController?.signal.addEventListener("abort", abort);

    // Request handlers
    if (xhr.upload) {
      xhr.upload.onprogress = (e): void => {
        const event = e as ProgressEvent<XMLHttpRequest>;
        const progress = {
          total: event.total,
          loaded: event.loaded,
        };
        onRequestProgress(progress);
      };
    }

    // Response handlers
    xhr.onloadstart = (): void => {
      onRequestEnd();
      onResponseStart();
    };

    xhr.onprogress = (e): void => {
      const event = e as ProgressEvent<XMLHttpRequest>;
      const progress = {
        total: event.total,
        loaded: event.loaded,
      };
      onResponseProgress(progress);
    };

    xhr.onloadend = () => {
      abortController?.signal.removeEventListener("abort", abort);
      onResponseEnd();
    };

    // Error listeners
    xhr.onabort = onAbortError;
    xhr.ontimeout = onTimeoutError;

    // Data listeners
    xhr.onerror = (e) => {
      const event = e as ProgressEvent<XMLHttpRequest>;
      if (event.target) {
        const data = parseErrorResponse(event.target.response);
        onError(data, event.target.status, resolve);
      } else {
        onUnexpectedError();
      }
    };

    xhr.onreadystatechange = (e) => {
      const event = e as ProgressEvent<XMLHttpRequest>;
      const finishedState = 4;

      const readyState = event.target?.readyState || 0;
      const status = event.target?.status || 0;
      const isSuccess = String(status).startsWith("2") || String(status).startsWith("3");

      if (readyState === finishedState) {
        onResponseEnd();

        if (isSuccess) {
          const data = parseResponse(event.target?.response);
          onSuccess(data, status, resolve);
        } else {
          const data = parseErrorResponse(event.target?.response);
          onError(data, status, resolve);
        }
      }
    };

    // Start request
    onBeforeRequest();

    xhr.send(payload);

    onRequestStart();
  });
};
