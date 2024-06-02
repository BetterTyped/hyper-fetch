/* eslint-disable no-param-reassign */
/* eslint-disable max-params */
import { RequestInstance, getErrorMessage } from "@hyper-fetch/core";
import { HttpResponse, http, HttpResponseResolver, delay } from "msw";

import { MockRequestOptions } from "./http";

export const getEndpointMockingRegex = (endpoint: string): RegExp => {
  return new RegExp(`^(?!.*\b${`${endpoint}/`}/\b).*${endpoint}.*`);
};

export const createMock = <Status extends number>(
  request: RequestInstance,
  options: MockRequestOptions<RequestInstance, Status>,
) => {
  const { method } = request;
  const status = options.status || 200;
  const delayTime = options.delay || 0;
  const url = getEndpointMockingRegex(request.endpoint);

  const data = status > 399 ? options.error : options.data;

  const requestResolver: HttpResponseResolver = async () => {
    if (delayTime) {
      await delay(delayTime);
    }

    const { requestManager } = request.client;
    const controllers = requestManager.abortControllers.get(request.abortKey);
    const size = controllers?.size || 0;
    const abortController = Array.from(controllers || [])[size - 1];
    const timeoutTime = request.options?.timeout ?? 5000;
    const shouldTimeout = timeoutTime < delayTime;

    if (abortController && abortController?.[1].signal.aborted) {
      const error = getErrorMessage("abort");
      return HttpResponse.json({ message: error.message }, { status: 0 });
    }
    if (shouldTimeout) {
      const error = getErrorMessage("timeout");
      return HttpResponse.json({ message: error.message }, { status: 500 });
    }

    return HttpResponse.json(data, { status });
  };

  switch (method.toUpperCase()) {
    case "POST":
      return http.post(url, requestResolver);
    case "PUT":
      return http.put(url, requestResolver);
    case "PATCH":
      return http.patch(url, requestResolver);
    case "DELETE":
      return http.delete(url, requestResolver);
    default:
      return http.get(url, requestResolver);
  }
};
