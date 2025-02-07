import { Adapter } from "@hyper-fetch/core";
import axios, { AxiosHeaders, Method as AxiosMethods, AxiosRequestConfig } from "axios";

import { AxiosExtra, RawAxiosHeaders } from "./adapter.types";

export type AxiosAdapterType = typeof AxiosAdapter;

export const AxiosAdapter = new Adapter<
  Omit<AxiosRequestConfig, "url" | "baseURL" | "method" | "onUploadProgress" | "onDownloadProgress" | "data">,
  AxiosMethods,
  number,
  AxiosExtra
>({
  defaultMethod: "GET",
  defaultExtra: { headers: {} },
  systemErrorStatus: 0,
  systemErrorExtra: { headers: {} },
}).setFetcher(
  async ({
    makeRequest,
    config,
    headers,
    fullUrl,
    payload,
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

    onBeforeRequest();

    return makeRequest((resolve) => {
      const controller = getAbortController();
      const unmountListener = () =>
        createAbortListener({ status: 0, extra: { headers: {} }, onAbort: () => {}, resolve });

      onRequestStart();
      axios({
        ...config,
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
          onSuccess({ data: response.data, status: response.status, extra: { headers: response.headers }, resolve });
          onResponseEnd();
        })
        .catch((error) => {
          onError({
            error,
            status: error.response?.status || 0,
            extra: { headers: error.response?.headers },
            resolve,
          });
        })
        .finally(() => {
          unmountListener();
        });
    });
  },
);
