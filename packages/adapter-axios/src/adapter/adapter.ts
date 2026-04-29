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
      const unmountListener = () =>
        createAbortListener({
          status: 0,
          extra: { headers: {} },
        });

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
          onRequestEnd();
          onResponseStart();
          onResponseProgress(progressEvent);
        },
      })
        .then((response) => {
          onSuccess({ data: response.data, status: response.status, extra: { headers: response.headers } });
          onResponseEnd();
        })
        .catch((error) => {
          onError({
            error,
            status: error.response?.status || adapter.systemErrorStatus,
            extra: { headers: error.response?.headers },
          });
        })
        .finally(() => {
          unmountListener();
        });
    },
  );
