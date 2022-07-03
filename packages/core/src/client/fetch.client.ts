import { getClientBindings, defaultTimeout, ClientResponseType, ClientType } from "client";
import { parseErrorResponse, parseResponse } from "./fetch.client.utils";

export const fetchClient: ClientType = async (command, requestId) => {
  if (!window.XMLHttpRequest) {
    throw new Error("There is no XMLHttpRequest, make sure it's provided to use Hyper Fetch built-in client.");
  }

  const {
    fullUrl,
    headers,
    payload,
    config,
    createAbortListener,
    onBeforeRequest,
    onRequestStart,
    onRequestProgress,
    onRequestEnd,
    onResponseStart,
    onResponseProgress,
    onSuccess,
    // onAbortError,
    // onTimeoutError,
    onError,
    onResponseEnd,
  } = await getClientBindings(command, requestId);

  const { method } = command;

  const xhr = new XMLHttpRequest();
  xhr.timeout = defaultTimeout;

  const abort = () => xhr.abort();

  return new Promise<ClientResponseType<unknown, unknown>>((resolve) => {
    // Inject xhr options
    Object.entries(config).forEach(([name, value]) => {
      xhr[name] = value;
    });

    // Open connection
    xhr.open(method, fullUrl, true);

    // Set Headers
    Object.entries(headers).forEach(([name, value]) => xhr.setRequestHeader(name, value));

    // Listen to abort signal
    const unmountListener = createAbortListener(abort, resolve);

    // Request handlers
    xhr.upload.onprogress = onRequestProgress;

    // Response handlers
    xhr.onloadstart = (): void => {
      onRequestEnd();
      onResponseStart();
    };

    xhr.onprogress = onResponseProgress;

    xhr.onloadend = () => {
      onResponseEnd();
      unmountListener();
    };

    // Error listeners
    // xhr.onabort = () => onAbortError(resolve);
    // xhr.ontimeout = () => onTimeoutError(resolve);
    // xhr.upload.onabort = () => onAbortError(resolve);
    // xhr.upload.ontimeout = () => onTimeoutError(resolve);

    // Data handler
    xhr.onreadystatechange = (e: Event) => {
      const event = e as unknown as ProgressEvent<XMLHttpRequest>;
      const finishedState = 4;

      if (event.target && event.target.readyState === finishedState) {
        const { status } = event.target;
        const isSuccess = String(status).startsWith("2") || String(status).startsWith("3");

        if (isSuccess) {
          const data = parseResponse(event.target.response);
          onSuccess(data, status, resolve);
        } else {
          // delay to finish after onabort/ontimeout
          const data = parseErrorResponse(event.target.response);
          onError(data, status, resolve);
        }
      }
    };

    // Start request
    onBeforeRequest();
    onRequestStart();

    xhr.send(payload);
  });
};
