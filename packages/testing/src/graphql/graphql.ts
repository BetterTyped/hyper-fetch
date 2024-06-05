/* eslint-disable no-nested-ternary */
import { setupServer } from "msw/node";
import { ExtractResponseType, RequestInstance } from "@hyper-fetch/core";

import { ErrorMockType, StatusCodesType, StatusErrorCodesType } from "../http/http.constants";
import { createMock } from "./graphql.mock";
import { MockRequestOptions } from "../http";
import { getMockSetup } from "http/http.mock";

export const createGraphqlMockingServer = () => {
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
    const { data } = getMockSetup(options, { gql: true });

    const mock = createMock(request, options);
    server.use(mock);
    return (data && "data" in data ? data?.data : data) as StatusType extends StatusErrorCodesType
      ? ErrorMockType
      : ExtractResponseType<T>;
  };

  return {
    server,
    startServer,
    stopServer,
    resetMocks,
    mockRequest,
  };
};
