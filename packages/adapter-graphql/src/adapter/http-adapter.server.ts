import { Adapter, getErrorMessage, parseErrorResponse, parseResponse, QueryParamsType } from "@hyper-fetch/core";
import http, { OutgoingHttpHeaders } from "http";
import https from "https";

import {
  gqlExtra,
  defaultTimeout,
  GraphQLAdapterType,
  getRequestValues,
  GraphQlExtraType,
  GraphqlMethod,
  GraphQlEndpointType,
  gqlEndpointMapper,
} from "adapter";

export const getGqlAdapter = (): GraphQLAdapterType =>
  new Adapter<
    Partial<XMLHttpRequest>,
    GraphqlMethod,
    number,
    GraphQlExtraType,
    QueryParamsType | string,
    undefined,
    GraphQlEndpointType
  >({
    name: "graphql",
    defaultMethod: GraphqlMethod.POST,
    defaultExtra: gqlExtra,
    systemErrorStatus: 0,
    systemErrorExtra: gqlExtra,
  })
    .setInternalErrorMapping((error) => [error])
    .setEndpointMapper(gqlEndpointMapper)
    .setFetcher(
      async ({
        request,
        adapterOptions,
        headers,
        onError,
        onResponseEnd,
        onTimeoutError,
        onRequestEnd,
        createAbortListener,
        onResponseProgress,
        onResponseStart,
        onBeforeRequest,
        onRequestStart,
        onSuccess,
      }) => {
        const { fullUrl, payload } = getRequestValues(request);

        const httpClient = request.client.url.includes("https://") ? https : http;
        const options = {
          method: request.method,
          headers: headers as OutgoingHttpHeaders,
          timeout: defaultTimeout,
          signal: undefined as AbortSignal | undefined,
        } satisfies https.RequestOptions;

        Object.entries(adapterOptions || {}).forEach(([name, value]) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          options[name] = value;
        });

        if (request.payload) {
          options.headers["Content-Length"] = Buffer.byteLength(JSON.stringify(payload));
        }

        onBeforeRequest();

        const unmountListener = createAbortListener({
          status: 0,
          extra: gqlExtra,
          onAbort: ({ signal }) => {
            options.signal = signal;
          },
        });

        const httpRequest = httpClient.request(fullUrl, options, (response) => {
          response.setEncoding("utf8");

          let chunks = "";
          const totalDownloadBytes = Number(response.headers["content-length"]);
          let downloadedBytes = 0;

          onRequestStart();

          response.on("data", (chunk) => {
            if (!chunks) {
              onRequestEnd();
              onResponseStart();
            }
            downloadedBytes += chunk.length;
            chunks += chunk;
            onResponseProgress({ total: totalDownloadBytes, loaded: downloadedBytes });
          });

          response.on("end", () => {
            const { statusCode = 0 } = response;
            const success = String(statusCode).startsWith("2") || String(statusCode).startsWith("3");

            if (success) {
              const { data, errors, extensions } = parseResponse(chunks);
              onSuccess({
                data: data ?? null,
                error: errors,
                status: statusCode,
                extra: { headers: response.headers as Record<string, string>, extensions: extensions ?? {} },
              });
            } else {
              // delay to finish after onabort/ontimeout
              const result = parseErrorResponse(chunks);

              const error = "errors" in result ? result.errors : result;
              const extensions = "extensions" in result ? result.extensions : undefined;

              onError({
                error: error ?? [getErrorMessage()],
                status: statusCode,
                extra: { headers: response.headers as Record<string, string>, extensions: extensions ?? {} },
              });
            }

            unmountListener();
            onResponseEnd();
          });
        });

        httpRequest.on("timeout", () => onTimeoutError({ status: 0, extra: gqlExtra }));
        httpRequest.on("error", (error) => onError({ error, status: 0, extra: gqlExtra }));
        if (payload) {
          httpRequest.write(payload);
        }
        httpRequest.end();
      },
    );
