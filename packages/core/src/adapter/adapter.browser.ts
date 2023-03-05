import { getAdapterBindings, defaultTimeout, ResponseType, BaseAdapterType } from "adapter";
import { parseErrorResponse, parseResponse } from "./adapter.utils";

export const browserAdapter: BaseAdapterType = async (request, requestId) => {
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
    onError,
    onResponseEnd,
    onTimeoutError,
  } = await getAdapterBindings(request, requestId);

  const { method = "GET" } = request;

  const xhr = new XMLHttpRequest();
  xhr.timeout = defaultTimeout;

  const abort = () => xhr.abort();

  return new Promise<ResponseType<unknown, unknown>>((resolve) => {
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

    xhr.ontimeout = () => onTimeoutError;

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
