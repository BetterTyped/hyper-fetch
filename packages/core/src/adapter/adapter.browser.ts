import {
  xhrExtra,
  getAdapterBindings,
  AdapterType,
  getResponseHeaders,
  parseResponse,
  parseErrorResponse,
} from "adapter";
import { defaultTimeout } from "./adapter.constants";

export const adapter: AdapterType = async (request, requestId) => {
  const {
    makeRequest,
    fullUrl,
    config,
    payload,
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
  } = await getAdapterBindings<AdapterType>({
    request,
    requestId,
    systemErrorStatus: 0,
    systemErrorExtra: {
      headers: {},
    },
  });

  const { method = "GET" } = request;

  return makeRequest((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.timeout = defaultTimeout;

    const onAbort = () => xhr.abort();

    // Inject xhr options
    if (config) {
      Object.entries(config).forEach(([name, value]) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        xhr[name] = value;
      });
    }

    // Open connection
    xhr.open(method, fullUrl, true);

    // Set Headers
    Object.entries(headers).forEach(([name, value]) => xhr.setRequestHeader(name, value as string));

    // Listen to abort signal
    const unmountListener = createAbortListener({ status: 0, extra: xhrExtra, onAbort, resolve });

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

    xhr.ontimeout = () => onTimeoutError({ status: 0, extra: xhrExtra, resolve });

    // Data handler
    xhr.onreadystatechange = (e: Event) => {
      const event = e as unknown as ProgressEvent<XMLHttpRequest>;
      const finishedState = 4;

      if (event.target && event.target.readyState === finishedState) {
        const { status } = event.target;
        const success = String(status).startsWith("2") || String(status).startsWith("3");
        const responseHeaders = getResponseHeaders(xhr.getAllResponseHeaders());

        if (success) {
          const data = parseResponse(event.target.response);
          onSuccess({ data, status, extra: { headers: responseHeaders }, resolve });
        } else {
          // delay to finish after onabort/ontimeout
          const error = parseErrorResponse(event.target.response);
          onError({ error, status, extra: { headers: responseHeaders }, resolve });
        }
      }
    };

    // Start request
    onBeforeRequest();
    onRequestStart();

    xhr.send(payload);
  });
};
