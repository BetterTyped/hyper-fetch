import { RequestInstance } from "../request";
import { BaseAdapterType } from "./adapter.types";
import { getAdapterBindings } from "./adapter.bindings";
import { defaultTimeout } from "./adapter.constants";
import { parseErrorResponse, parseResponse } from "./adapter.utils";

export const handleXhrRequest = <T extends RequestInstance>(
  resolve,
  method,
  {
    fullUrl,
    config,
    headers,
    onError,
    onResponseEnd,
    onTimeoutError,
    onRequestEnd,
    createAbortListener,
    onResponseProgress,
    onRequestProgress,
    onResponseStart,
    onBeforeRequest,
    onRequestStart,
    onSuccess,
  }: Omit<Awaited<ReturnType<typeof getAdapterBindings<T, BaseAdapterType>>>, "requestWrapper">,
): XMLHttpRequest => {
  const xhr = new XMLHttpRequest();
  xhr.timeout = defaultTimeout;

  const abort = () => xhr.abort();
  // Inject xhr options
  Object.entries(config).forEach(([name, value]) => {
    xhr[name] = value;
  });

  // Open connection
  xhr.open(method, fullUrl, true);

  // Set Headers
  Object.entries(headers).forEach(([name, value]) => xhr.setRequestHeader(name, value as string));

  // Listen to abort signal
  const unmountListener = createAbortListener(0, {}, abort, resolve);

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

  xhr.ontimeout = () => onTimeoutError(0, {}, resolve);

  // Data handler
  xhr.onreadystatechange = (e: Event) => {
    const event = e as unknown as ProgressEvent<XMLHttpRequest>;
    const finishedState = 4;

    if (event.target && event.target.readyState === finishedState) {
      const { status } = event.target;
      const isSuccess = String(status).startsWith("2") || String(status).startsWith("3");

      if (isSuccess) {
        const data = parseResponse(event.target.response);
        onSuccess(data, status, {}, resolve);
      } else {
        // delay to finish after onabort/ontimeout
        const data = parseErrorResponse(event.target.response);
        onError(data, status, {}, resolve);
      }
    }
  };

  // Start request
  onBeforeRequest();
  onRequestStart();

  return xhr;
};
