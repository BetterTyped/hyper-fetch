/* eslint-disable no-param-reassign */
/* eslint-disable max-params */
import { RequestInstance, getErrorMessage } from "@hyper-fetch/core";
import { HttpResponse, http, HttpResponseResolver, delay } from "msw";

import { MockRequestOptions } from "./http";
import { errorResponses } from "./http.constants";

export const getEndpointMockingRegex = (endpoint: string): RegExp => {
  return new RegExp(`^(?!.*\b${`${endpoint}/`}/\b).*${endpoint}.*`);
};

export const getMockSetup = <Request extends RequestInstance, Status extends number, Gql extends true | false>(
  options: MockRequestOptions<Request, Status>,
  config: { gql?: Gql } = {},
) => {
  const status = options.status || 200;
  const delayTime = options.delay || 20;
  const syntheticError = errorResponses?.[status as keyof typeof errorResponses];
  const error = (config?.gql ? { errors: [syntheticError] } : syntheticError) as Gql extends true
    ? { errors: [typeof syntheticError] }
    : typeof syntheticError;
  const syntheticData = (
    config.gql ? { data: options.data || {} } || { data: {} } : options.data || {}
  ) as Gql extends true ? { data: {} } : {};
  const data =
    status > 399 ? ((options.error || error) as Gql extends true ? { errors: Error[] } : Error) : syntheticData;

  return {
    status,
    delayTime,
    data,
  };
};

export const createMock = <Request extends RequestInstance, Status extends number>(
  request: Request,
  options: MockRequestOptions<Request, Status>,
) => {
  const { method } = request;
  const { status, delayTime, data } = getMockSetup(options);
  const url = getEndpointMockingRegex(request.endpoint);

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
