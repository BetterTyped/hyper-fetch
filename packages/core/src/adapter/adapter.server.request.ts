import http, { OutgoingHttpHeaders } from "http";
import stream from "stream";
import https from "https";

import { RequestInstance } from "../request";
import { getAdapterBindings } from "./adapter.bindings";
import { BaseAdapterType } from "./adapter.types";
import { defaultTimeout } from "./adapter.constants";
import { getStreamPayload, getUploadSize, parseErrorResponse, parseResponse } from "./adapter.utils";
import { HttpMethodsEnum } from "../constants/http.constants";

export const handleServerRequest = <T extends RequestInstance>(
  request,
  resolve,
  {
    fullUrl,
    config,
    headers,
    onError,
    payload,
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
  }: Omit<Awaited<ReturnType<typeof getAdapterBindings<T, BaseAdapterType>>>, "requestWrapper">,
) => {
  const { method = HttpMethodsEnum.get, client } = request;
  const httpClient = client.url.includes("https://") ? https : http;
  const execute = async () => {
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

    const httpRequest = httpClient.request(options, (response) => {
      response.setEncoding("utf8");
      unmountListener = createAbortListener(0, {}, response.destroy, resolve);

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
          onSuccess(data, statusCode, {}, resolve);
        } else {
          // delay to finish after onabort/ontimeout
          const data = parseErrorResponse(chunks);
          onError(data, statusCode, {}, resolve);
        }

        unmountListener();
        onResponseEnd();
      });
    });

    httpRequest.on("timeout", () => onTimeoutError(0, {}, resolve));
    httpRequest.on("error", (error) => onError(error, 0, {}, resolve));

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
  };
  return execute;
};
