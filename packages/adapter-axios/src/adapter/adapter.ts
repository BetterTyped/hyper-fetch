import { getAdapterBindings } from "@hyper-fetch/core";
import axios, { AxiosHeaders } from "axios";

import { AxiosAdapterType, RawAxiosHeaders } from "./adapter.types";

export const AxiosAdapter = (): AxiosAdapterType => async (request, requestId) => {
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
  } = await getAdapterBindings<AxiosAdapterType>({
    request,
    requestId,
    systemErrorStatus: 0,
    systemErrorExtra: { headers: {} },
  });

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
        onError({ error, status: error.response?.status || 0, extra: { headers: error.response?.headers }, resolve });
      })
      .finally(() => {
        unmountListener();
      });
  });
};
