import { DateInterval } from "constants/time.constants";
import {
  setClientHeaders,
  getClientPayload,
  handleClientError,
  handleClientSuccess,
  setClientOptions,
  setRequestProgress,
  setResponseProgress,
  stringifyQueryParams,
} from "./fetch.client.utils";
import { ClientResponseType, ClientType, ClientQueryParamsType } from "./fetch.client.types";

export const fetchClient: ClientType<any, any, ClientQueryParamsType> = async (middleware, options) => {
  if (!XMLHttpRequest) {
    throw new Error("There is no XMLHttpRequest, make sure it's provided to use React-Fetch built-in client.");
  }

  const xhr = new XMLHttpRequest();

  xhr.timeout = DateInterval.second * 4;

  let requestStartTimestamp: null | number = null;
  let responseStartTimestamp: null | number = null;

  const middlewareInstance = await middleware.builderConfig.onRequestCallbacks(middleware);
  const { builderConfig, endpoint, queryParams, data, method } = middlewareInstance;

  const url = builderConfig.baseUrl + endpoint + stringifyQueryParams(queryParams, options?.queryParams);

  return new Promise<ClientResponseType<any, any>>((resolve) => {
    requestStartTimestamp = +new Date();
    responseStartTimestamp = null;

    // Setup Request
    setClientOptions(middlewareInstance, xhr);

    xhr.open(method, url, true);

    setClientHeaders(middlewareInstance, xhr);
    middleware.abortController?.signal?.addEventListener("abort", xhr.abort);

    // Request listeners
    middlewareInstance.requestStartCallback?.();
    setRequestProgress(middlewareInstance, requestStartTimestamp || +new Date(), { total: 1, loaded: 0 });

    if (xhr.upload) {
      xhr.upload.onprogress = (e): void => {
        setRequestProgress(middlewareInstance, requestStartTimestamp || +new Date(), e);
      };
    }

    // Response listeners
    xhr.onprogress = (e): void => {
      requestStartTimestamp = null;
      setRequestProgress(middlewareInstance, requestStartTimestamp || +new Date(), { total: 1, loaded: 1 });

      setResponseProgress(
        middlewareInstance,
        responseStartTimestamp || +new Date(),
        e as ProgressEvent<XMLHttpRequest>,
      );
    };

    xhr.onloadstart = (): void => {
      responseStartTimestamp = +new Date();
      middlewareInstance.responseStartCallback?.();
    };

    // Error listeners
    xhr.onabort = (e): void => {
      handleClientError(middlewareInstance, resolve, e as ProgressEvent<XMLHttpRequest>, "abort");
    };
    xhr.ontimeout = (e): void => {
      handleClientError(middlewareInstance, resolve, e as ProgressEvent<XMLHttpRequest>, "timeout");
    };
    xhr.onerror = (e): void => {
      handleClientError(middlewareInstance, resolve, e as ProgressEvent<XMLHttpRequest>);
    };

    // State listeners
    xhr.onloadend = (): void => {
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

      const isSuccess = status.startsWith("2") || status.startsWith("3");

      if (isSuccess) {
        handleClientSuccess(middlewareInstance, event, resolve);
      } else {
        handleClientError(middlewareInstance, resolve, event);
      }
      middleware.abortController?.signal?.removeEventListener("abort", xhr.abort);
    };

    // Send request
    xhr.send(getClientPayload(data));
  });
};
