import http, { OutgoingHttpHeaders } from "http";
import https from "https";
import { HttpMethods, parseResponse } from "@hyper-fetch/core";

import { xhrExtra, defaultTimeout, AdapterType, getAdapterBindings, parseErrorResponse } from "adapter";

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
  } = await getAdapterBindings<AdapterType>({ request, requestId, systemErrorStatus: 0, systemErrorExtra: xhrExtra });

  const { method = HttpMethods.GET, client } = request;
  const httpClient = client.url.includes("https://") ? https : http;
  const options = {
    method,
    headers: headers as OutgoingHttpHeaders,
    timeout: defaultTimeout,
  };

  Object.entries(config).forEach(([name, value]) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    options[name] = value;
  });

  let unmountListener: () => void = () => undefined;
  onBeforeRequest();

  if (payload) {
    options.headers["Content-Length"] = Buffer.byteLength(JSON.stringify(payload));
  }

  const requestUrl = !fullUrl.startsWith("http") ? `http://${fullUrl}` : fullUrl;

  return makeRequest((resolve) => {
    const httpRequest = httpClient.request(requestUrl, options, (response) => {
      // TODO - Change to settable from options
      response.setEncoding("utf8");
      unmountListener = createAbortListener(0, xhrExtra, response.destroy, resolve);
      onRequestStart();

      // if (requestResponseType === "stream") {
      //   onSuccess(response, 200, { headers: response.headers as Record<string, string> }, resolve);
      //   unmountListener();
      //   onResponseEnd();
      //   return;
      // }

      // const responseChunks: string[] = [];
      let chunks = "";
      const totalDownloadBytes = Number(response.headers["content-length"]);
      let downloadedBytes = 0;

      response.on("data", (chunk) => {
        if (!chunks) {
          // if (!responseChunks.length) {
          onRequestEnd();
          onResponseStart();
        }
        downloadedBytes += chunk.length;
        chunks += chunk;
        // responseChunks.push(chunk);

        onResponseProgress({ total: totalDownloadBytes, loaded: downloadedBytes });
      });

      response.on("end", async () => {
        const { statusCode = 0 } = response;
        const success = String(statusCode).startsWith("2") || String(statusCode).startsWith("3");

        if (success) {
          const data = parseResponse(chunks);
          onSuccess(data, statusCode, { headers: response.headers as Record<string, string> }, resolve);
          // TODO - try catch
          // const responseData = handleResponse(responseChunks, requestResponseType, "utf8");
          // onSuccess(responseData, statusCode, { headers: response.headers as Record<string, string> }, resolve);
        } else {
          // delay to finish after onabort/ontimeout
          // const data = parseErrorResponse(responseChunks.toString());
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
