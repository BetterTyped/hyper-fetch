import { FetchMiddlewareInstance } from "middleware";
import { ExtractResponse } from "types";

export type FetchMockType<T> = () => {
  endpoint: string;
  method: string;
  fixture: ApiReturnType<T>;
};

export type ApiReturnType<T> = T extends FetchMiddlewareInstance ? ExtractResponse<T> : never;

export const buildMock = <T extends FetchMiddlewareInstance>(
  apiRequest: T,
  mock: ApiReturnType<T>,
): FetchMockType<T> => {
  return () => ({
    endpoint: apiRequest.endpoint,
    method: apiRequest.method,
    fixture: mock,
  });
};
