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

  const cancelableMiddleware = middleware.cancelRequest ? middleware : middleware.setCancelToken(() => xhr.abort);
  const middlewareInstance = await cancelableMiddleware.builderConfig.onRequestCallbacks(middleware);
  const { builderConfig, endpoint, queryParams = "", data, method } = middlewareInstance;

  const url = builderConfig.baseUrl + endpoint + queryParams;

  return new Promise<ClientResponseType<any, any>>((resolve) => {
    requestStartTimestamp = null;
    responseStartTimestamp = null;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    xhr.upload = {};

    // Setup Request
    setClientOptions(middlewareInstance, xhr);

    xhr.open(method, url);
    setClientHeaders(middlewareInstance, xhr);

    // Request listeners group ↓
    xhr.upload.onerror = (e): void => {
      handleClientError(middlewareInstance, e as ProgressEvent<XMLHttpRequest>, resolve);
    };
    xhr.upload.onabort = (e): void => {
      handleClientError(middlewareInstance, e as ProgressEvent<XMLHttpRequest>, resolve);
    };
    xhr.upload.ontimeout = (e): void => {
      handleClientError(middlewareInstance, e as ProgressEvent<XMLHttpRequest>, resolve);
    };

    xhr.upload.onprogress = (e): void => {
      setRequestProgress(middlewareInstance, requestStartTimestamp || +new Date(), e as ProgressEvent<XMLHttpRequest>);
    };

    xhr.upload.onloadstart = (e): void => {
      requestStartTimestamp = +new Date();
      middlewareInstance.requestStartCallbacks?.forEach((callback: (arg0: ProgressEvent<XMLHttpRequest>) => void) =>
        callback(e as ProgressEvent<XMLHttpRequest>),
      );
    };

    xhr.upload.onloadend = (): void => {
      requestStartTimestamp = null;
    };

    // Response listeners group ↓
    xhr.onerror = (e): void => {
      handleClientError(middlewareInstance, e as ProgressEvent<XMLHttpRequest>, resolve);
    };
    xhr.onabort = (e): void => {
      handleClientError(middlewareInstance, e as ProgressEvent<XMLHttpRequest>, resolve);
    };
    xhr.ontimeout = (e): void => {
      handleClientError(middlewareInstance, e as ProgressEvent<XMLHttpRequest>, resolve);
    };

    xhr.onprogress = (e): void => {
      setResponseProgress(
        middlewareInstance,
        responseStartTimestamp || +new Date(),
        e as ProgressEvent<XMLHttpRequest>,
      );
    };

    xhr.onloadstart = (e): void => {
      responseStartTimestamp = +new Date();
      middlewareInstance.responseStartCallbacks?.forEach((callback: (e: ProgressEvent<XMLHttpRequest>) => void) =>
        callback(e as ProgressEvent<XMLHttpRequest>),
      );
    };

    xhr.onloadend = (): void => {
      responseStartTimestamp = null;
    };

    xhr.onreadystatechange = (e): void => {
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
