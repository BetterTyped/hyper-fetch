import type { QueryParamsType } from "adapter";
import { HttpMethods, SAFE_HTTP_METHODS } from "constants/http.constants";
import type { HttpMethodsType, HttpStatusType } from "types";

import { Adapter } from "../adapter/adapter";
import { defaultTimeout, xhrExtra } from "./http-adapter.constants";
import type { HttpAdapterExtraType, FetchAdapterOptionsType, FetchResponseType } from "./http-adapter.types";
import { parseErrorResponse, parseResponse, stringifyQueryParams } from "./http-adapter.utils";

const defaultExtra = xhrExtra;

/**
 * Size in bytes of a body that fetch sends as it is. Form data and streams get their size from the browser while they
 * are sent, so it is unknown up front.
 */
const getBodySize = (body: unknown): number | undefined => {
  if (typeof body === "string") return new Blob([body]).size;
  if (typeof Blob !== "undefined" && body instanceof Blob) return body.size;
  if (body instanceof ArrayBuffer) return body.byteLength;
  if (ArrayBuffer.isView(body)) return body.byteLength;
  if (typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams) {
    return new Blob([body.toString()]).size;
  }
  return undefined;
};

/**
 * Body of a successful response in the shape picked with the `responseType` option
 */
const readResponseBody = (bytes: Uint8Array, responseType: FetchResponseType | undefined, contentType: string | null) => {
  switch (responseType) {
    case "arrayBuffer": {
      return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    }
    case "blob": {
      return new Blob([bytes as BlobPart], { type: contentType ?? "" });
    }
    case "text": {
      return new TextDecoder().decode(bytes);
    }
    default: {
      return parseResponse(new TextDecoder().decode(bytes));
    }
  }
};

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
    // Safe reads (GET, QUERY) deduplicate by default: concurrent identical requests collapse
    // into one network call. Explicit `deduplicate` in request options still wins.
    .setRequestDefaults((options) => {
      const method = options.method ?? HttpMethods.GET;
      if (SAFE_HTTP_METHODS.includes(method)) {
        return { deduplicate: true };
      }
      return {};
    })
    .setFetcher(
      async ({
        request,
        url,
        endpoint,
        queryParams,
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
        onSuccess,
      }) => {
        const { method } = request;
        const fullUrl = `${url}${endpoint}${queryParams}`;

        const controller = getAbortController();
        const {
          timeout: timeoutMs = defaultTimeout,
          streaming = false,
          responseType,
          ...restOptions
        } = adapterOptions || {};

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

        const body = payload && method !== "GET" && method !== "HEAD" ? (payload as BodyInit) : undefined;
        const bodySize = getBodySize(body);

        onBeforeRequest();
        onRequestStart(bodySize ? { total: bodySize, loaded: 0 } : undefined);

        try {
          const init: RequestInit = {
            method,
            headers: headers as Record<string, string>,
            signal: controller?.signal,
            ...restOptions,
          };

          if (body) {
            init.body = body;
          }

          const response = await fetch(fullUrl, init);

          // Fetch has no upload events. The response is the first sign that the whole body was sent.
          onRequestEnd();

          // The timeout covers the whole exchange - a body that stops arriving has to end with the timeout error.
          // Only a streamed body is handed over to the user as soon as the headers arrive.
          if (timeoutId && streaming && response.body) {
            clearTimeout(timeoutId);
          }

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
            // The body is read as bytes from the stream. Without a stream reader (e.g. React Native) it is read with
            // the method matching the response type - text for the default one, so nothing more than text is needed.
            let body: { bytes: Uint8Array } | { text: string } | { data: Blob | ArrayBuffer };

            if (response.body && typeof response.body.getReader === "function") {
              const reader = response.body.getReader();
              // Fetch gives the decompressed body, while Content-Length tells the size of the encoded one - the total
              // of an encoded body is unknown
              const contentEncoding = response.headers.get("content-encoding");
              const isEncoded = !!contentEncoding && contentEncoding !== "identity";
              const contentLength = isEncoded ? 0 : parseInt(response.headers.get("content-length") || "0", 10);
              let receivedLength = 0;
              const chunks: Uint8Array[] = [];

              // eslint-disable-next-line no-constant-condition
              while (true) {
                // eslint-disable-next-line no-await-in-loop
                const { done, value } = await reader.read();
                if (done) {
                  break;
                }
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
              body = { bytes: allChunks };
            } else if (response.ok && responseType === "blob") {
              body = { data: await response.blob() };
            } else if (response.ok && responseType === "arrayBuffer") {
              body = { data: await response.arrayBuffer() };
            } else {
              body = { text: await response.text() };
            }

            if (timeoutId) {
              clearTimeout(timeoutId);
            }

            onResponseEnd();
            unmountListener();

            const getText = () => ("text" in body ? body.text : new TextDecoder().decode("bytes" in body ? body.bytes : undefined));

            if (response.ok) {
              let data: unknown;
              if ("data" in body) {
                data = body.data;
              } else if ("bytes" in body) {
                data = readResponseBody(body.bytes, responseType, response.headers.get("content-type"));
              } else {
                data = responseType === "text" ? body.text : parseResponse(body.text);
              }
              onSuccess({ data, status, extra });
            } else {
              const error = parseErrorResponse(getText());
              onError({ error, status, extra });
            }
          }
        } catch (error: any) {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
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
