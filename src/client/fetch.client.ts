import {
  setClientHeaders,
  getClientPayload,
  handleClientError,
  handleClientSuccess,
  setClientOptions,
  setRequestProgress,
  setResponseProgress,
} from "./fetch.client.utils";
import { ClientResponseType, ClientType } from "./fetch.client.types";

export const fetchClient: ClientType<any, any> = async (middleware) => {
  if (!window.fetch) {
    throw new Error("There is no window.fetch, make sure it's provided when using SSR.");
  }

  const xhr = new XMLHttpRequest();

  middleware.setCancelToken(() => xhr.abort);

  let requestStartTimestamp: null | number = null;
  let responseStartTimestamp: null | number = null;

  const middlewareInstance = await middleware.builderConfig.onRequestCallbacks(middleware);
  const { builderConfig, endpoint, queryParams = "", data, method } = middlewareInstance;

  const url = builderConfig.baseUrl + endpoint + queryParams;

  return new Promise<ClientResponseType<any, any>>((resolve) => {
    requestStartTimestamp = null;
    responseStartTimestamp = null;

    // Setup Request
    setClientOptions(middlewareInstance, xhr);

    xhr.open(method, url);
    setClientHeaders(middlewareInstance, xhr);

    // Request listeners group ↓
    xhr.upload.onerror = (e) => {
      handleClientError(middlewareInstance, e as ProgressEvent<XMLHttpRequest>, resolve);
    };
    xhr.upload.onabort = (e) => {
      handleClientError(middlewareInstance, e as ProgressEvent<XMLHttpRequest>, resolve);
    };
    xhr.upload.ontimeout = (e) => {
      handleClientError(middlewareInstance, e as ProgressEvent<XMLHttpRequest>, resolve);
    };

    xhr.upload.onprogress = (e) => {
      setRequestProgress(middlewareInstance, requestStartTimestamp || +new Date(), e as ProgressEvent<XMLHttpRequest>);
    };

    xhr.upload.onloadstart = (e) => {
      requestStartTimestamp = +new Date();
      middlewareInstance.requestStartCallbacks?.forEach((callback) => callback(e as ProgressEvent<XMLHttpRequest>));
    };

    xhr.upload.onloadend = () => {
      requestStartTimestamp = null;
    };

    // Response listeners group ↓
    xhr.onerror = (e) => {
      handleClientError(middlewareInstance, e as ProgressEvent<XMLHttpRequest>, resolve);
    };
    xhr.onabort = (e) => {
      handleClientError(middlewareInstance, e as ProgressEvent<XMLHttpRequest>, resolve);
    };
    xhr.ontimeout = (e) => {
      handleClientError(middlewareInstance, e as ProgressEvent<XMLHttpRequest>, resolve);
    };

    xhr.onprogress = (e) => {
      setResponseProgress(
        middlewareInstance,
        responseStartTimestamp || +new Date(),
        e as ProgressEvent<XMLHttpRequest>,
      );
    };

    xhr.onloadstart = (e) => {
      responseStartTimestamp = +new Date();
      middlewareInstance.responseStartCallbacks?.forEach((callback) => callback(e as ProgressEvent<XMLHttpRequest>));
    };

    xhr.onloadend = () => {
      responseStartTimestamp = null;
    };

    xhr.onreadystatechange = (e) => {
      const event = e as ProgressEvent<XMLHttpRequest>;
      const finishedState = 4;

      const readyState = event.target?.readyState || 0;
      const status = event.target?.status?.toString() || "";

      if (readyState !== finishedState || !event.target) {
        return;
      }

      if (status.startsWith("2") || status.startsWith("3")) {
        handleClientSuccess(middlewareInstance, event, resolve);
      } else {
        handleClientError(middlewareInstance, event, resolve);
      }
    };

    // Send request
    xhr.send(getClientPayload(data));
  });
};
