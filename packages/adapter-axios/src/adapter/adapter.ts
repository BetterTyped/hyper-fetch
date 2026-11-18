import { Adapter, stringifyQueryParams } from "@hyper-fetch/core";
import type { Method as AxiosMethods, AxiosRequestConfig } from "axios";
import axios, { AxiosHeaders } from "axios";

import type { AxiosExtra, RawAxiosHeaders } from "./adapter.types";

export type AxiosAdapterType = typeof AxiosAdapter;

/** Pre-configured adapter that uses Axios as the underlying HTTP transport. Supports upload/download progress and abort. */
export const AxiosAdapter = new Adapter<
  Omit<AxiosRequestConfig, "url" | "baseURL" | "method" | "onUploadProgress" | "onDownloadProgress" | "data">,
  AxiosMethods,
  number,
  AxiosExtra
>({
  name: "axios-adapter",
  defaultMethod: "GET",
  defaultExtra: { headers: {} },
  systemErrorStatus: 0,
  systemErrorExtra: { headers: {} },
})
  .setQueryParamsMapper(stringifyQueryParams)
  .setFetcher(
    async ({
      url,
      endpoint,
      queryParams,
      request,
      headers,
      payload,
      adapter,
      adapterOptions,
      onError,
      onResponseEnd,
      onRequestEnd,
      createAbortListener,
      onResponseProgress,
      onRequestProgress,
      onResponseStart,
      onBeforeRequest,
      onRequestStart,
      onSuccess,
      getAbortController,
    }) => {
      const { method } = request;

      const fullUrl = `${url}${endpoint}${queryParams}`;

      onBeforeRequest();

      const controller = getAbortController();
      // Reports the abort itself, so the request resolves with the abort error (and is never retried)
      const unmountListener = createAbortListener({
        status: 0,
        extra: { headers: {} },
      });

      if (controller?.signal.aborted) {
        unmountListener();
        return;
      }

      // The upload is over and the response has started once: with the first downloaded bytes, or with the
      // response itself when it has no body
      let hasResponseStarted = false;
      const startResponse = () => {
        if (hasResponseStarted) {
          return;
        }
        hasResponseStarted = true;
        onRequestEnd();
        onResponseStart();
      };

      onRequestStart();
      axios({
        ...adapterOptions,
        data: payload,
        method,
        url: fullUrl,
        signal: controller?.signal,
        headers: new AxiosHeaders(headers as RawAxiosHeaders),
        onUploadProgress: (progressEvent) => {
          onRequestProgress(progressEvent);
        },
        onDownloadProgress: (progressEvent) => {
          startResponse();
          onResponseProgress(progressEvent);
        },
      })
        .then((response) => {
          startResponse();
          onResponseEnd();
          onSuccess({ data: response.data, status: response.status, extra: { headers: response.headers } });
        })
        .catch((error) => {
          // The abort listener already resolved the request
          if (controller?.signal.aborted) {
            return;
          }
          if (error.response) {
            startResponse();
          }
          onError({
            error,
            status: error.response?.status || adapter.systemErrorStatus,
            extra: { headers: error.response?.headers ?? {} },
          });
        })
        .finally(() => {
          unmountListener();
        });
    },
  );
