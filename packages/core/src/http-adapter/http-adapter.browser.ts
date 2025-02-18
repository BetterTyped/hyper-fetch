import { getResponseHeaders, parseErrorResponse, parseResponse, stringifyQueryParams } from "./http-adapter.utils";
import { defaultTimeout, xhrExtra } from "./http-adapter.constants";
import { Adapter } from "../adapter/adapter";
import { HttpMethods } from "constants/http.constants";
import { HttpMethodsType, HttpStatusType } from "types";
import { HttpAdapterOptionsType, HttpAdapterExtraType } from "./http-adapter.types";
import { QueryParamsType } from "adapter";

export const getAdapter = () =>
  new Adapter<
    HttpAdapterOptionsType,
    HttpMethodsType,
    HttpStatusType,
    HttpAdapterExtraType,
    QueryParamsType | string | null,
    undefined,
    string
  >({
    name: "browser",
    defaultMethod: HttpMethods.GET,
    defaultExtra: xhrExtra,
    systemErrorStatus: 0 as number,
    systemErrorExtra: xhrExtra,
  })
    .setQueryParamsMapper(stringifyQueryParams)
    .setFetcher(
      async ({
        request,
        adapterOptions,
        headers,
        payload,
        onError,
        onResponseEnd,
        onTimeoutError,
        onRequestEnd,
        createAbortListener,
        onResponseProgress,
        onResponseStart,
        onBeforeRequest,
        onRequestStart,
        onRequestProgress,
        onSuccess,
      }) => {
        const { method, client, endpoint } = request;
        const fullUrl = `${client.url}${endpoint}`;
        const xhr = new XMLHttpRequest();
        xhr.timeout = defaultTimeout;
        const onAbort = () => xhr.abort();
        // Inject xhr options
        if (adapterOptions) {
          Object.entries(adapterOptions).forEach(([name, value]) => {
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
        const unmountListener = createAbortListener({ status: 0, extra: xhrExtra, onAbort });
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

        /* istanbul ignore next */
        xhr.ontimeout = () => onTimeoutError({ status: 0, extra: xhrExtra });
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
              onSuccess({ data, status, extra: { headers: responseHeaders } });
            } else {
              // delay to finish after onabort/ontimeout
              const error = parseErrorResponse(event.target.response);
              onError({ error, status, extra: { headers: responseHeaders } });
            }
          }
        };
        // Start request
        onBeforeRequest();
        onRequestStart();
        xhr.send(payload as XMLHttpRequestBodyInit);
      },
    );
