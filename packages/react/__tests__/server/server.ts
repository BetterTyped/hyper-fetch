import { setupServer } from "msw/node";
import { ExtractResponseType, RequestInstance } from "@hyper-fetch/core";

import { getInterceptEndpoint, createStubMethod } from "./server.utils";
import { ErrorMockType, errorResponses, StatusCodesType, StatusErrorCodesType } from "./server.constants";

export const server = setupServer();

export const startServer = (): void => {
  server.listen();
};

export const resetInterceptors = (): void => {
  server.resetHandlers();
};

export const stopServer = (): void => {
  server.close();
};

export const createRequestInterceptor = <T extends RequestInstance, StatusType extends StatusCodesType>(
  request: T,
  props?: {
    fixture?: ExtractResponseType<T>;
    status?: StatusType;
    delay?: number;
  },
): StatusType extends StatusErrorCodesType ? ErrorMockType : ExtractResponseType<T> => {
  const { fixture, status, delay } = props || {};
  const { endpoint, method } = request;
  const url = getInterceptEndpoint(endpoint);

  const currentStatus: StatusCodesType = status || 200;

  if (currentStatus !== 200 && currentStatus in errorResponses) {
    const errorResponse = errorResponses[currentStatus] as StatusType extends StatusErrorCodesType
      ? ErrorMockType
      : ExtractResponseType<T>;
    server.use(createStubMethod(request, url, method, currentStatus, errorResponse, delay));

    return errorResponse;
  }

  const responseData = (fixture !== undefined ? fixture : { data: [1, 2, 3] }) as ExtractResponseType<T>;

  server.use(createStubMethod(request, url, method, currentStatus, responseData, delay));
  return responseData as StatusType extends StatusErrorCodesType ? ErrorMockType : ExtractResponseType<T>;
};
