import { getAdapterBindings, getErrorMessage, HttpMethods, parseResponse } from "@hyper-fetch/core";
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

  const { method = HttpMethods.GET } = request;
  const httpClient = request.client.url.includes("https://") ? https : http;
  const requestUrl = !fullUrl.startsWith("http") ? `http://${fullUrl}` : fullUrl;

  const options = {
    method,
    headers: headers as OutgoingHttpHeaders,
    timeout: defaultTimeout,
    signal: undefined as AbortSignal | undefined,
  } satisfies https.RequestOptions;

  if (config) {
    Object.entries(config).forEach(([name, value]) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      options[name] = value;
    });
  }

  let unmountListener = () => {};
  onBeforeRequest();

  if (payload) {
    options.headers["Content-Length"] = Buffer.byteLength(JSON.stringify(payload));
  }

  return makeRequest((resolve) => {
    unmountListener = createAbortListener(
      0,
      gqlExtra,
      ({ signal }) => {
        options.signal = signal;
      },
      resolve,
    );

    const httpRequest = httpClient.request(requestUrl, options, (response) => {
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
        const res = parseResponse(chunks);
        const data = res?.data || null;
        const extensions = res?.extensions || {};
        const failure = res?.errors || statusCode > 399 || statusCode === 0;

        if (failure) {
          // delay to finish after onabort/ontimeout
          const error = res?.errors || [getErrorMessage()];
          onError(error, statusCode, { headers: response.headers as Record<string, string>, extensions }, resolve);
        } else {
          onSuccess(data, statusCode, { headers: response.headers as Record<string, string>, extensions }, resolve);
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
