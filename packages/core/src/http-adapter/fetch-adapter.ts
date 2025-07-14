import { Adapter } from "../adapter/adapter";
import { HttpAdapterOptionsType, HttpAdapterExtraType } from "./http-adapter.types";
import { HttpMethods } from "constants/http.constants";
import { HttpMethodsType, HttpStatusType } from "types";
import { stringifyQueryParams } from "./http-adapter.utils";
import { QueryParamsType } from "adapter";
import { defaultTimeout, xhrExtra } from "./http-adapter.constants";

/**
 * Fetch adapter that works in both browser and server environments
 * Uses the native fetch API with support for all HyperFetch features
 */
export const FetchAdapter = () =>
  new Adapter<
    HttpAdapterOptionsType,
    HttpMethodsType,
    HttpStatusType,
    HttpAdapterExtraType,
    QueryParamsType | string | null,
    undefined,
    string
  >({
    name: "fetch-adapter",
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
        getAbortController,
        onResponseProgress,
        onResponseStart,
        onBeforeRequest,
        onRequestStart,
        onRequestProgress,
        onSuccess,
      }) => {
        const payloadData = payload;
        const { method, client, endpoint } = request;
        const fullUrl = `${client.url}${endpoint}`;
        // Create fetch options
        const fetchOptions: RequestInit = {
          method,
          headers: headers as HeadersInit,
          signal: getAbortController()?.signal,
        };
        // Apply adapter options
        if (adapterOptions) {
          Object.entries(adapterOptions).forEach(([name, value]) => {
            if (name === "timeout") {
              // Handle timeout separately since fetch doesn't have built-in timeout
              return;
            }
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            fetchOptions[name] = value;
          });
        }

        // TODO fallback to xmlHttpRequest for firefox + safari ?
        if (payload instanceof ReadableStream) {
          let uploadedBytes = 0;
          const requestPayloadSize = headers?.get("content-size");
          const transformStream = new TransformStream({
            start() {},
            transform(chunk, controller) {
              uploadedBytes += Buffer.byteLength(chunk);
              onRequestProgress({ total: requestPayloadSize, loaded: uploadedBytes });
              controller.enqueue(chunk);
            },
          });
          fetchOptions.body = payload.pipeThrough(transformStream);
        }
        fetchOptions.body = payloadData as any;

        // Set up abort listener
        const unmountListener = createAbortListener({
          status: 0,
          extra: xhrExtra,
        });

        let timeoutId: NodeJS.Timeout | null = null;
        if (adapterOptions?.timeout || defaultTimeout) {
          const timeout = adapterOptions?.timeout || defaultTimeout;
          timeoutId = setTimeout(() => {
            onTimeoutError({ status: 0, extra: xhrExtra });
            getAbortController()?.abort();
          }, timeout);
        }

        try {
          onBeforeRequest();
          onRequestStart();

          // Start request
          const response = await fetch(fullUrl, fetchOptions);
          // Clear timeout
          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          onRequestEnd();
          onResponseStart();

          // TODO add option to buffer stream or return in 'normally'
          const success = response.ok;
          if (success) {
            const responseHeaders: Record<string, string> = {};
            response.headers.forEach((value, key) => {
              responseHeaders[key] = value;
            });
            if (response.body instanceof ReadableStream) {
              const contentLength = Number(response.headers?.get("content-length")) || 0;
              let totalDownloadBytes = 0;
              const transformStream = new TransformStream({
                start() {},
                transform(chunk, controller) {
                  totalDownloadBytes += Buffer.byteLength(chunk);
                  onResponseProgress({ total: contentLength, loaded: totalDownloadBytes });
                  controller.enqueue(chunk);
                },
              });
              onSuccess({
                data: response.body.pipeThrough(transformStream),
                status: response.status,
                extra: { headers: responseHeaders },
              });
            } else {
              // TODO - add parseResponse/parseBody etc. + responseEncoding passing.
              onSuccess({
                data: response.body,
                status: response.status,
                extra: { headers: responseHeaders },
              });
            }
          }

          onResponseEnd();
          unmountListener();
        } catch (error) {
          // Clear timeout
          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          // Handle fetch errors
          if (error instanceof Error) {
            if (error.name === "AbortError") {
              // Request was aborted, this is handled by the abort listener
              return;
            }
            onError({ error, status: 0, extra: xhrExtra });
          } else {
            onError({ error, status: 0, extra: xhrExtra });
          }

          onResponseEnd();
          unmountListener();
        }
      },
    );
