import { getAdapterBindings, parseErrorResponse, parseResponse } from "@hyper-fetch/core";
import http, { OutgoingHttpHeaders } from "http";
import https from "https";

import { gqlExtra, defaultTimeout, GraphQLAdapterType, getRequestValues } from "adapter";

export const adapter: GraphQLAdapterType = async (request, requestId) => {
  const {
    makeRequest,
    config,
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
  } = await getAdapterBindings<GraphQLAdapterType>({
    request,
    requestId,
    systemErrorStatus: 0,
    systemErrorExtra: gqlExtra,
    internalErrorFormatter: (error) => [error],
  });

  const { fullUrl, payload } = getRequestValues(request);

  const httpClient = request.client.url.includes("https://") ? https : http;
  const options = {
    method: request.method,
    headers: headers as OutgoingHttpHeaders,
    timeout: defaultTimeout,
    signal: undefined as AbortSignal | undefined,
  } satisfies https.RequestOptions;

  Object.entries(config || {}).forEach(([name, value]) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    options[name] = value;
  });

  // if (request.payload) {
  //   options.headers["Content-Length"] = Buffer.byteLength(JSON.stringify(payload));
  // }

  onBeforeRequest();

  return makeRequest((resolve) => {
    const unmountListener = createAbortListener({
      status: 0,
      extra: gqlExtra,
      onAbort: ({ signal }) => {
        options.signal = signal;
      },
      resolve,
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
            data,
            error: errors,
            status: statusCode,
            extra: { headers: response.headers as Record<string, string>, extensions: extensions ?? {} },
            resolve,
          });
        } else {
          // delay to finish after onabort/ontimeout
          const result = parseErrorResponse(chunks);

          const error = "errors" in result ? result.errors : result;
          const extensions = "extensions" in result ? result.extensions : undefined;

          onError({
            error,
            status: statusCode,
            extra: { headers: response.headers as Record<string, string>, extensions: extensions ?? {} },
            resolve,
          });
        }

        unmountListener();
        onResponseEnd();
      });
    });

    httpRequest.on("timeout", () => onTimeoutError({ status: 0, extra: gqlExtra, resolve }));
    httpRequest.on("error", (error) => onError({ error, status: 0, extra: gqlExtra, resolve }));
    if (payload) {
      httpRequest.write(payload);
    }
    httpRequest.end();
  });
};
