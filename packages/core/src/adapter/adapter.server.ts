import http, { OutgoingHttpHeaders } from "http";
import https from "https";

import { xhrExtra, defaultTimeout, AdapterType, getAdapterBindings, parseErrorResponse, parseResponse } from "adapter";
import { HttpMethodsEnum } from "../constants/http.constants";

export const adapter: AdapterType = async (request, requestId) => {
  const {
    makeRequest,
    fullUrl,
    config,
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
    onSuccess,
  } = await getAdapterBindings<AdapterType>(request, requestId, 0, xhrExtra);

  const { method = HttpMethodsEnum.get, client } = request;
  const httpClient = client.url.includes("https://") ? https : http;
  const options = {
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
    const httpRequest = httpClient.request(fullUrl, options, (response) => {
      response.setEncoding("utf8");
      unmountListener = createAbortListener(0, xhrExtra, response.destroy, resolve);

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
        const success = String(statusCode).startsWith("2") || String(statusCode).startsWith("3");

        if (success) {
          const data = parseResponse(chunks);
          onSuccess(data, statusCode, { headers: response.headers as Record<string, string> }, resolve);
        } else {
          // delay to finish after onabort/ontimeout
          const data = parseErrorResponse(chunks);
          onError(data, statusCode, { headers: response.headers as Record<string, string> }, resolve);
        }

        unmountListener();
        onResponseEnd();
      });
    });

    httpRequest.on("timeout", () => onTimeoutError(0, xhrExtra, resolve));
    httpRequest.on("error", (error) => onError(error, 0, xhrExtra, resolve));
    if (payload) {
      httpRequest.write(payload);
    }
    httpRequest.end();
  });
};
