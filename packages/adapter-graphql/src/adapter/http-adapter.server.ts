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
    name: "graphql-server",
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
        getAbortController,
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
          signal: getAbortController()?.signal,
        } satisfies https.RequestOptions;

        Object.entries(adapterOptions || {}).forEach(([name, value]) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          options[name] = value;
        });

        onBeforeRequest();

        const unmountListener = createAbortListener({
          status: 0,
          extra: gqlExtra,
        });

        const httpRequest = httpClient.request(fullUrl, options, (response) => {
          response.setEncoding("utf8");

          let chunks = "";
          const totalDownloadBytes = Number(response.headers["content-length"]);
          let downloadedBytes = 0;

          onRequestStart();

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

          response.on("end", () => {
            /* istanbul ignore next */
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
              /* istanbul ignore next */
              const error = "errors" in result ? result.errors : null;
              /* istanbul ignore next */
              const extensions = "extensions" in result ? result.extensions : {};

              onError({
                error: error ?? [getErrorMessage()],
                status: statusCode,
                extra: { headers: response.headers as Record<string, string>, extensions },
              });
            }

            unmountListener();
            onResponseEnd();
          });
        });

        /* istanbul ignore next */
        httpRequest.on("timeout", () => onTimeoutError({ status: 0, extra: gqlExtra }));
        httpRequest.on("error", (error) => onError({ error, status: 0, extra: gqlExtra }));
        if (payload) {
          httpRequest.write(payload);
        }
        httpRequest.end();
      },
    );
