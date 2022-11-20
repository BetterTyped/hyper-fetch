import http from "http";
import stream from "stream";

import { getClientBindings, defaultTimeout, ClientResponseType, ClientType } from "client";
import { parseErrorResponse, parseResponse, getUploadSize } from "./fetch.client.utils";

export const serverClient: ClientType = async (command, requestId) => {
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
    // onAbortError,
    // onTimeoutError,
    onError,
    onResponseEnd,
  } = await getClientBindings(command, requestId);

  const abortController = new AbortController();
  const { method } = command;

  return new Promise<ClientResponseType<unknown, unknown>>((resolve) => {
    const unmountListener = createAbortListener(abortController.abort, resolve);
    const options: http.RequestOptions = {
      path: fullUrl,
      signal: abortController.signal,
      method,
      headers: headers as http.RequestOptions["headers"],
      timeout: defaultTimeout,
    };

    // Inject xhr options
    Object.entries(config).forEach(([name, value]) => {
      options[name] = value;
    });

    onBeforeRequest();

    const totalUploadBytes = payload ? Number(getUploadSize(payload)) : 0;
    let uploadedBytes = 0;

    const request = http.request(options, (response) => {
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
    request.on("error", (error) => onError(error, 0, resolve));
    if (payload) {
      const readableStream = stream.Readable.from(payload, { objectMode: false });
      const data = stream
        .pipeline([readableStream])
        .on("data", (chunk) => {
          if (!uploadedBytes) onRequestStart();
          uploadedBytes += chunk.length;
          onRequestProgress({ total: totalUploadBytes, loaded: uploadedBytes });
        })
        .on("end", onRequestEnd);

      request.write(data);
    }
    request.end();
  });
};
