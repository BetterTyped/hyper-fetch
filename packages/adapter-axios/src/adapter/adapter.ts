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
    const unmountListener = () => createAbortListener(0, { headers: {} }, () => {}, resolve);

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
