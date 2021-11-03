import { FetchMiddlewareInstance } from "middleware";
import { ExtractResponse } from "types";

export type FetchMockType<T> = () => {
  endpoint: string;
  method: string;
  fixture: ApiReturnType<T>;
  request: FetchMiddlewareInstance;
};

export type ApiReturnType<T> = T extends FetchMiddlewareInstance ? ExtractResponse<T> : never;

export const buildMock = <T extends FetchMiddlewareInstance>(request: T, mock: ApiReturnType<T>): FetchMockType<T> => {
  return () => ({
    endpoint: request.endpoint,
    method: request.method,
    fixture: mock,
    request,
  });
};
