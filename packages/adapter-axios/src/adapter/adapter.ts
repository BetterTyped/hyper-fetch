import { getAdapterBindings } from "@hyper-fetch/core";
import axios, { AxiosHeaders, RawAxiosRequestHeaders } from "axios";

import { AxiosAdapterType } from "./adapter.types";

export const axiosAdapter = (): AxiosAdapterType => async (request, requestId) => {
  const {
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
  } = await getAdapterBindings<AxiosAdapterType>(request, requestId, 0, { headers: {} });

  const { method } = request;

  onBeforeRequest();

  return makeRequest((resolve) => {
    const controller = getAbortController();
    const unmountListener = () => createAbortListener(0, { headers: {} }, () => {}, resolve);

    onRequestStart();
    axios({
      ...config,
      data: payload,
      method,
      url: fullUrl,
      signal: controller.signal,
      headers: new AxiosHeaders(headers as RawAxiosRequestHeaders),
      onUploadProgress: payload
        ? (progressEvent) => {
            onRequestProgress(progressEvent);
          }
        : undefined,
      onDownloadProgress: (progressEvent) => {
        onRequestEnd();
        onResponseStart();
        onResponseProgress(progressEvent);
      },
    })
      .then((response) => {
        onSuccess(response.data, response.status, { headers: response.headers }, resolve);
        onResponseEnd();
      })
      .catch((error) => {
        onError(error, error.response?.status || 0, { headers: error.response?.headers }, resolve);
      })
      .finally(() => {
        unmountListener();
      });
  });
};
