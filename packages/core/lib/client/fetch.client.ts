import {
  getClientBindings,
  defaultTimeout,
  ClientResponseType,
  ClientType,
  handleError,
  handleReadyStateChange,
  handleProgress,
} from "client";

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
    onResponseEnd,
    onSuccess,
    onAbortError,
    onTimeoutError,
    onUnexpectedError,
    onError,
  } = await getClientBindings(command, requestId);

  const { method } = command;

  const xhr = new XMLHttpRequest();
  xhr.timeout = defaultTimeout;

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
    const unmountListener = createAbortListener(abort);

    // Request handlers
    xhr.upload.onprogress = handleProgress(onRequestProgress);

    // Response handlers
    xhr.onloadstart = (): void => {
      onRequestEnd();
      onResponseStart();
    };

    xhr.onprogress = handleProgress(onResponseProgress);

    xhr.onloadend = () => {
      unmountListener();
      onResponseEnd();
    };

    // Error listeners
    xhr.onabort = onAbortError;
    xhr.ontimeout = onTimeoutError;
    xhr.upload.onabort = onAbortError;
    xhr.upload.ontimeout = onTimeoutError;

    // Data listeners
    xhr.onerror = handleError({ onError, onUnexpectedError }, resolve);

    xhr.onreadystatechange = handleReadyStateChange({ onError, onSuccess, onResponseEnd }, resolve);

    // Start request
    onBeforeRequest();

    xhr.send(payload);

    onRequestStart();
  });
};
