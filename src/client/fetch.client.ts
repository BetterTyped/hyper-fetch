import { DateInterval } from "constants/time.constants";
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
  if (!window.XMLHttpRequest) {
    throw new Error("There is no window.XMLHttpRequest, make sure it's provided to use React-Fetch built-in client.");
  }

  const xhr = new XMLHttpRequest();

  xhr.timeout = DateInterval.second * 4;

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

    xhr.open(method, url, true);

    setClientHeaders(middlewareInstance, xhr);
    middleware.abortController?.signal?.addEventListener("abort", xhr.abort);

    // Request listeners
    if (xhr.upload) {
      xhr.upload.onprogress = (e): void => {
        setRequestProgress(
          middlewareInstance,
          requestStartTimestamp || +new Date(),
          e as ProgressEvent<XMLHttpRequest>,
        );
      };

      xhr.upload.onloadstart = (e): void => {
        requestStartTimestamp = +new Date();
        middlewareInstance.requestStartCallbacks?.forEach((callback: (arg: ProgressEvent<XMLHttpRequest>) => void) =>
          callback(e as ProgressEvent<XMLHttpRequest>),
        );
      };

      xhr.upload.onloadend = (): void => {
        requestStartTimestamp = null;
      };
    }

    // Response listeners
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

    // Error listeners
    if (xhr.upload) {
      xhr.upload.onabort = (e): void => {
        handleClientError(middlewareInstance, resolve, e as ProgressEvent<XMLHttpRequest>, "abort");
      };
      xhr.upload.ontimeout = (e): void => {
        handleClientError(middlewareInstance, resolve, e as ProgressEvent<XMLHttpRequest>, "timeout");
      };
      xhr.upload.onerror = (e): void => {
        handleClientError(middlewareInstance, resolve, e as ProgressEvent<XMLHttpRequest>);
      };
    }
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

    // Send request
    xhr.send(getClientPayload(data));

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
