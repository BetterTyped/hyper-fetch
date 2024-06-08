import { setupServer } from "msw/node";
import {
  ResponseType,
  ExtractResponseType,
  ExtractErrorType,
  RequestInstance,
  ExtractAdapterType,
} from "@hyper-fetch/core";

import { ErrorMockType, StatusCodesType, StatusErrorCodesType } from "./http.constants";
import { createMock, getMockSetup } from "./http.mock";

export type MockRequestOptions<Request extends RequestInstance, Status extends number> = Partial<
  Omit<
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ResponseType<ExtractResponseType<Request>, ExtractErrorType<Request>, ExtractAdapterType<Request>>,
    "status" | "extra"
  >
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
    const { data } = getMockSetup(options);

    const mock = createMock(request, options);
    server.use(mock);
    return (data || "") as StatusType extends StatusErrorCodesType ? ErrorMockType : ExtractResponseType<T>;
  };

  return {
    server,
    startServer,
    stopServer,
    resetMocks,
    mockRequest,
  };
};
