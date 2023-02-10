import http, { OutgoingHttpHeaders } from "http";
import https from "https";
import stream from "stream";

import { getAdapterBindings, defaultTimeout, ResponseType, AdapterType, AdapterOptionsType } from "adapter";
import { parseErrorResponse, parseResponse, getUploadSize, getStreamPayload } from "./adapter.utils";

export const adapter: AdapterType = async (request, requestId) => {
  const {
    fullUrl,
    headers,
    payload,
    config,
    createAbortListener,
    onBeforeRequest,
    onRequestStart,
    onRequestProgress,
    onRequestEnd,
    onResponseStart,
    onResponseProgress,
    onSuccess,
    onTimeoutError,
    onError,
    onResponseEnd,
  } = await getAdapterBindings<AdapterOptionsType>(request, requestId);
  const { method, client } = request;
  const httpClient = client.url.includes("https://") ? https : http;

  return new Promise<ResponseType<unknown, unknown>>((resolve) => {
    const execute = async () => {
      const options = {
        path: fullUrl,
        method,
        headers: headers as OutgoingHttpHeaders,
        timeout: defaultTimeout,
      };

      // Inject xhr options
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
            onSuccess(data, statusCode, resolve);
          } else {
            // delay to finish after onabort/ontimeout
            const data = parseErrorResponse(chunks);
            onError(data, statusCode, resolve);
          }

          unmountListener();
          onResponseEnd();
        });
      });

      unmountListener = createAbortListener(httpRequest.destroy, resolve);

      httpRequest.on("timeout", () => onTimeoutError(resolve));
      httpRequest.on("error", (error) => onError(error, 0, resolve));

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
    execute();
  });
};
