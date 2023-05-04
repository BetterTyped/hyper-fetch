import http, { OutgoingHttpHeaders } from "http";
import stream from "stream";
import https from "https";

import { getAdapterBindings } from "./adapter.bindings";
import { BaseAdapterType } from "./adapter.types";
import { defaultTimeout } from "./adapter.constants";
import { getStreamPayload, getUploadSize, parseErrorResponse, parseResponse } from "./adapter.utils";
import { HttpMethodsEnum } from "../constants/http.constants";
import { xhrAdditionalData } from "client";

export const adapter: BaseAdapterType = async (request, requestId) => {
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
    onRequestProgress,
    onResponseStart,
    onBeforeRequest,
    onRequestStart,
    onSuccess,
  } = await getAdapterBindings<BaseAdapterType>(request, requestId, 0, xhrAdditionalData);

  const { method = HttpMethodsEnum.get, client } = request;
  const httpClient = client.url.includes("https://") ? https : http;
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

  const totalUploadBytes = payload ? Number(getUploadSize(payload)) : 0;
  let uploadedBytes = 0;

  const payloadChunks = await getStreamPayload(payload);

  return makeRequest((resolve) => {
    const httpRequest = httpClient.request(options, (response) => {
      response.setEncoding("utf8");
      unmountListener = createAbortListener(0, xhrAdditionalData, response.destroy, resolve);

      let chunks = "";
      const totalDownloadBytes = Number(response.headers["content-length"]);
      let downloadedBytes = 0;

      response.on("data", (chunk) => {
        if (!chunks) onResponseStart();
        downloadedBytes += chunk.length;
        chunks += chunk;
        onResponseProgress({ total: totalDownloadBytes, loaded: downloadedBytes });
      });

      response.on("end", () => {
        const { statusCode } = response;
        const isSuccess = String(statusCode).startsWith("2") || String(statusCode).startsWith("3");

        if (isSuccess) {
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

    httpRequest.on("timeout", () => onTimeoutError(0, xhrAdditionalData, resolve));
    httpRequest.on("error", (error) => onError(error, 0, xhrAdditionalData, resolve));

    if (payloadChunks) {
      const readableStream = stream.Readable.from(payloadChunks, { objectMode: false })
        .on("data", (chunk) => {
          if (!uploadedBytes) onRequestStart();
          uploadedBytes += chunk.length;
          onRequestProgress({ total: totalUploadBytes, loaded: uploadedBytes });
        })
        .on("end", () => {
          onRequestEnd();
        });

      readableStream.pipe(httpRequest);
    } else {
      httpRequest.end();
    }
  });
};
