import { getAdapterBindings } from "@hyper-fetch/core";
import axios, { AxiosHeaders, RawAxiosRequestHeaders } from "axios";

import { AxiosAdapterType } from "./adapter.types";

export const axiosAdapter = (): AxiosAdapterType => async (request, requestId) => {
  const {
    fullUrl,
    makeRequest,
    config,
    headers,
    onError,
    onResponseEnd,
    onRequestEnd,
    createAbortListener,
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
      method,
      url: fullUrl,
      signal: controller.signal,
      headers: new AxiosHeaders(headers as RawAxiosRequestHeaders),
    })
      .then((response) => {
        onRequestEnd();
        onResponseStart();
        onSuccess(response.data, response.status, { headers: response.headers }, resolve);
      })
      .then(() => {
        onResponseEnd();
        unmountListener();
      })
      .catch((error) => {
        onError(error, error.response?.status, { headers: error.response?.headers }, resolve);
      });
  });
};
