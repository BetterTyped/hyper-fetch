import type { QueryParamsType } from "adapter";
import { HttpMethods } from "constants/http.constants";
import type { HttpMethodsType, HttpStatusType } from "types";

import { Adapter } from "../adapter/adapter";
import { defaultTimeout, xhrExtra } from "./http-adapter.constants";
import type { HttpAdapterExtraType, FetchAdapterOptionsType } from "./http-adapter.types";
import { parseErrorResponse, parseResponse, stringifyQueryParams } from "./http-adapter.utils";

const defaultExtra = xhrExtra;

export const getAdapter = () =>
  new Adapter<
    FetchAdapterOptionsType,
    HttpMethodsType,
    HttpStatusType,
    HttpAdapterExtraType,
    QueryParamsType | string | null,
    undefined,
    string
  >({
    name: "http",
    defaultMethod: HttpMethods.GET,
    defaultExtra,
    systemErrorStatus: 0 as number,
    systemErrorExtra: defaultExtra,
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
        const { method, client, endpoint, queryParams } = request;
        const queryString = queryParams ? stringifyQueryParams(queryParams) : "";
        const fullUrl = `${client.url}${endpoint}${queryString}`;

        const controller = getAbortController();
        const { timeout: timeoutMs = defaultTimeout, streaming = false, ...restOptions } = adapterOptions || {};

        let timedOut = false;
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        // Abort listener handles user-initiated aborts (e.g. request.abort())
        // For fetch, onAbort is a no-op since the signal is already passed to fetch()
        const unmountListener = createAbortListener({
          status: 0,
          extra: defaultExtra,
        });

        if (timeoutMs > 0 && controller) {
          timeoutId = setTimeout(() => {
            timedOut = true;
            unmountListener();
            controller.abort();
          }, timeoutMs);
        }

        onBeforeRequest();
        onRequestStart();

        try {
          const init: RequestInit = {
            method,
            headers: headers as Record<string, string>,
            signal: controller?.signal,
            ...restOptions,
          };

          if (payload && method !== "GET" && method !== "HEAD") {
            init.body = payload as BodyInit;

            if (typeof payload === "string") {
              const total = new Blob([payload]).size;
              onRequestProgress({ total, loaded: total } as ProgressEvent);
            }
          }

          onRequestEnd();

          const response = await fetch(fullUrl, init);

          if (timeoutId) {clearTimeout(timeoutId);}

          onResponseStart();

          const responseHeaders: Record<string, string> = {};
          response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
          });
          const extra: HttpAdapterExtraType = { headers: responseHeaders };
          const { status } = response;

          if (streaming && response.body) {
            onResponseEnd();
            unmountListener();

            if (response.ok) {
              onSuccess({ data: response.body as any, status, extra });
            } else {
              const errorBody = await response.text();
              const error = parseErrorResponse(errorBody);
              onError({ error, status, extra });
            }
          } else {
            let body: string;

            if (response.body && typeof response.body.getReader === "function") {
              const reader = response.body.getReader();
              const contentLength = parseInt(response.headers.get("content-length") || "0", 10);
              let receivedLength = 0;
              const chunks: Uint8Array[] = [];

              // eslint-disable-next-line no-constant-condition
              while (true) {
                // eslint-disable-next-line no-await-in-loop
                const { done, value } = await reader.read();
                if (done) {break;}
                chunks.push(value);
                receivedLength += value.length;
                onResponseProgress({ total: contentLength || receivedLength, loaded: receivedLength } as ProgressEvent);
              }

              const allChunks = new Uint8Array(receivedLength);
              let position = 0;
              // eslint-disable-next-line no-restricted-syntax
              for (const chunk of chunks) {
                allChunks.set(chunk, position);
                position += chunk.length;
              }
              body = new TextDecoder().decode(allChunks);
            } else {
              body = await response.text();
            }

            onResponseEnd();
            unmountListener();

            if (response.ok) {
              const data = parseResponse(body);
              onSuccess({ data, status, extra });
            } else {
              const error = parseErrorResponse(body);
              onError({ error, status, extra });
            }
          }
        } catch (error: any) {
          if (timeoutId) {clearTimeout(timeoutId);}
          unmountListener();

          if (controller?.signal?.aborted) {
            if (timedOut) {
              onTimeoutError({ status: 0, extra: defaultExtra });
            }
            return;
          }

          onError({ error, status: 0, extra: defaultExtra });
        }
      },
    );
