import { setupServer } from "msw/node";

import { ExtractResponse } from "types";
import { FetchCommandInstance } from "command";
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

export const createRequestInterceptor = <T extends FetchCommandInstance, StatusType extends StatusCodesType>(
  command: T,
  props?: {
    fixture?: ExtractResponse<T>;
    status?: StatusType;
    delay?: number;
  },
): StatusType extends StatusErrorCodesType ? ErrorMockType : ExtractResponse<T> => {
  const { fixture, status, delay } = props || {};
  const { endpoint, method } = command;
  const url = getInterceptEndpoint(endpoint);

  const currentStatus: StatusCodesType = status || 200;

  if (currentStatus !== 200 && currentStatus in errorResponses) {
    const errorResponse = errorResponses[currentStatus] as StatusType extends StatusErrorCodesType
      ? ErrorMockType
      : ExtractResponse<T>;
    server.use(createStubMethod(command, url, method, currentStatus, errorResponse, delay));

    return errorResponse;
  }

  const responseData = fixture as ExtractResponse<T>;

  server.use(createStubMethod(command, url, method, currentStatus, responseData, delay));
  return responseData;
};
