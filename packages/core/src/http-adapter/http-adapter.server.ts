import http, { OutgoingHttpHeaders } from "http";
import https from "https";

import { Adapter } from "../adapter/adapter";
import { HttpAdapterOptionsType, HttpAdapterExtraType } from "./http-adapter.types";
import { HttpMethods } from "constants/http.constants";
import { HttpMethodsType, HttpStatusType } from "types";
import { parseErrorResponse, parseResponse, stringifyQueryParams } from "./http-adapter.utils";
import { QueryParamsType } from "adapter";
import { defaultTimeout, xhrExtra } from "./http-adapter.constants";

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
    name: "http-server",
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
        adapter,
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
        const { method, client, endpoint, queryParams } = request;
        const { url } = client;
        const httpClient = client.url.includes("https://") ? https : http;
        const options = {
          method,
          headers: headers as OutgoingHttpHeaders,
          timeout: defaultTimeout,
          signal: getAbortController()?.signal,
        } satisfies https.RequestOptions;

        if (adapterOptions) {
          Object.entries(adapterOptions).forEach(([name, value]) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            options[name] = value;
          });
        }

        onBeforeRequest();

        if (payload) {
          // Calculate Content-Length based on the exact bytes that will be sent.
          // If payload is already a string or Buffer (as produced by getAdapterPayload),
          // avoid double-stringifying which would lead to incorrect Content-Length.
          const payloadAsAny = payload as unknown;
          const isString = typeof payloadAsAny === "string";
          const isBuffer = Buffer.isBuffer(payloadAsAny);
          const contentLength =
            isString || isBuffer
              ? Buffer.byteLength(payloadAsAny as string | Buffer)
              : Buffer.byteLength(JSON.stringify(payloadAsAny));
          options.headers["Content-Length"] = contentLength;
        }

        const queryString = queryParams ? stringifyQueryParams(queryParams) : "";
        const fullUrl = `${url}${endpoint}${queryString}`;

        const unmountListener = createAbortListener({
          status: 0,
          extra: xhrExtra,
        });

        const httpRequest = httpClient.request(fullUrl, options, (response) => {
          // TODO - Change to settable from options
          response.setEncoding("utf8");
          onRequestStart();

          let chunks = "";
          const totalDownloadBytes = Number(response.headers["content-length"]);
          let downloadedBytes = 0;

          response.on("data", (chunk) => {
            /* istanbul ignore next */
            if (!chunks) {
              onRequestEnd();
              onResponseStart();
            }
            downloadedBytes += chunk.length;
            chunks += chunk;

            onResponseProgress({ total: totalDownloadBytes, loaded: downloadedBytes });
          });

          response.on("end", async () => {
            /* istanbul ignore next */
            const { statusCode = adapter.systemErrorStatus } = response;
            const success = String(statusCode).startsWith("2") || String(statusCode).startsWith("3");

            if (success) {
              const data = parseResponse(chunks);
              onSuccess({
                data,
                status: statusCode,
                extra: { headers: response.headers as Record<string, string> },
              });
            } else {
              // delay to finish after onabort/ontimeout
              const data = parseErrorResponse(chunks);
              onError({
                error: data,
                status: statusCode,
                extra: { headers: response.headers as Record<string, string> },
              });
            }

            unmountListener();
            onResponseEnd();
          });
        });

        httpRequest.on("timeout", () => onTimeoutError({ status: 0, extra: xhrExtra }));
        httpRequest.on("error", (error) => onError({ error, status: 0, extra: xhrExtra }));
        if (payload) {
          httpRequest.write(payload);
        }
        httpRequest.end();
      },
    );
