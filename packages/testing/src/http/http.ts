import { setupServer } from "msw/node";
import {
  ResponseType,
  ExtractResponseType,
  ExtractErrorType,
  RequestInstance,
  ExtractAdapterType,
} from "@hyper-fetch/core";

import { ErrorMockType, StatusCodesType, StatusErrorCodesType } from "./http.constants";
import { createMock } from "./http.mock";

export type MockRequestOptions<T extends RequestInstance, Status extends number> = Partial<
  ResponseType<ExtractResponseType<T>, ExtractErrorType<T>, ExtractAdapterType<T>>
> & {
  status?: Status;
  delay?: number;
};

export const createHttpMockingServer = () => {
  const server = setupServer();

  const startServer = (): void => {
    server.listen();
  };

  const resetMocks = (): void => {
    server.resetHandlers();
  };

  const stopServer = (): void => {
    server.close();
  };

  /**
   * Mock a request
   *
   * @param request
   * @param options
   * @returns expected response
   */
  const mockRequest = <T extends RequestInstance, StatusType extends StatusCodesType>(
    request: T,
    options: MockRequestOptions<T, StatusType> = {},
  ): StatusType extends StatusErrorCodesType ? ErrorMockType : ExtractResponseType<T> => {
    const status = options?.status || 200;
    const response = status > 399 ? options.error : options.data;

    const mock = createMock(request, options);
    server.use(mock);
    return (response || "") as StatusType extends StatusErrorCodesType ? ErrorMockType : ExtractResponseType<T>;
  };

  return {
    server,
    startServer,
    stopServer,
    resetMocks,
    mockRequest,
  };
};
