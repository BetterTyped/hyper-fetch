import { GraphQLError } from "graphql";
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
    internalErrorFormatter: (error) => ({
      errors: [error] satisfies readonly Partial<GraphQLError>[],
    }),
  });

  const { fullUrl, payload, method } = getRequestValues(request);

  const httpClient = request.client.url.includes("https://") ? https : http;
  const options = {
    path: fullUrl,
    method,
    headers: headers as OutgoingHttpHeaders,
    timeout: defaultTimeout,
  };

  Object.entries(config).forEach(([name, value]) => {
    options[name] = value;
  });

  let unmountListener = () => null;
  onBeforeRequest();

  if (payload) {
    options.headers["Content-Length"] = Buffer.byteLength(JSON.stringify(payload));
  }

  return makeRequest((resolve) => {
    const httpRequest = httpClient.request(options, (response) => {
      response.setEncoding("utf8");
      unmountListener = createAbortListener(0, gqlExtra, response.destroy, resolve);

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
        const { statusCode } = response;
        const res = parseResponse(chunks);
        const data = res?.data;
        const extensions = res?.extensions || {};
        const success = (String(statusCode).startsWith("2") || String(statusCode).startsWith("3")) && !data?.errors;

        if (success) {
          onSuccess(data, statusCode, { headers: response.headers as Record<string, string>, extensions }, resolve);
        } else {
          // delay to finish after onabort/ontimeout
          const error = data || parseErrorResponse(chunks);
          onError(error, statusCode, { headers: response.headers as Record<string, string>, extensions }, resolve);
        }

        unmountListener();
        onResponseEnd();
      });
    });

    httpRequest.on("timeout", () => onTimeoutError(0, gqlExtra, resolve));
    httpRequest.on("error", (error) => onError(error, 0, gqlExtra, resolve));
    if (payload) {
      httpRequest.write(payload);
    }
    httpRequest.end();
  });
};
