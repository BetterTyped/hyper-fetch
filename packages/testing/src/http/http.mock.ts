/* eslint-disable no-param-reassign */
/* eslint-disable max-params */
import { RequestInstance, getErrorMessage } from "@hyper-fetch/core";
import { HttpResponse, http, HttpResponseResolver, delay } from "msw";

import { MockRequestOptions } from "./http";
import { errorResponses } from "./http.constants";

export const getEndpointMockingRegex = (endpoint: string): RegExp => {
  return new RegExp(`^(?!.*\b${`${endpoint}/`}/\b).*${endpoint}.*`);
};

const getStatus = <Request extends RequestInstance, Status extends number>(
  options: MockRequestOptions<Request, Status>,
) => {
  const status = options.status || 200;

  return status;
};

const getErrorMock = <Request extends RequestInstance, Status extends number, Gql extends true | false>(
  options: MockRequestOptions<Request, Status>,
  config: { gql?: Gql } = {},
) => {
  const { error } = options;
  const status = getStatus(options);
  const syntheticError = errorResponses?.[status as keyof typeof errorResponses];

  if (error === null) {
    return null;
  }

  if (!error && !syntheticError) {
    return undefined;
  }

  if (config.gql) {
    return error || [syntheticError];
  }
  return error || syntheticError;
};

const getIsSuccessMock = <Request extends RequestInstance, Status extends number, Gql extends true | false>(
  options: MockRequestOptions<Request, Status>,
  config: { gql?: Gql } = {},
) => {
  const status = getStatus(options);

  if (config.gql) {
    const failure = options.error || status > 399 || status === 0;
    return !failure;
  }

  return status < 399 && status !== 0 && !options.error;
};

const getDataMock = <Request extends RequestInstance, Status extends number, Gql extends true | false>(
  options: MockRequestOptions<Request, Status>,
  config: { gql?: Gql } = {},
): any => {
  const success = getIsSuccessMock(options, config);
  const errors = getErrorMock(options, config);
  const data = options.data !== undefined ? options.data : {};

  if (config.gql) {
    const response: Record<string, any> = {};

    if (data) {
      response.data = data;
    }
    if (errors !== undefined) {
      response.errors = errors;
    }

    return response;
  }

  return success ? data || {} : errors;
};

export const getMockSetup = <Request extends RequestInstance, Status extends number, Gql extends true | false>(
  options: MockRequestOptions<Request, Status>,
  config: { gql?: Gql } = {},
) => {
  const status = getStatus(options);
  const delayTime = options.delay || 20;
  const data = getDataMock(options, config);

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
    const abortController: any = Array.from(controllers || [])[size - 1];
    // Todo: something generic?
    const timeoutTime = (request.options as any)?.timeout ?? 5000;
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

  switch (String(method).toUpperCase()) {
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
