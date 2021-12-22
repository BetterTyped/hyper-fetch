import { FetchCommandInstance } from "command";
import { ExtractResponse } from "types";

export type FetchMockType<T> = () => {
  endpoint: string;
  method: string;
  fixture: ApiReturnType<T>;
  request: FetchCommandInstance;
};

export type ApiReturnType<T> = T extends FetchCommandInstance ? ExtractResponse<T> : never;

export const buildMock = <T extends FetchCommandInstance>(request: T, mock: ApiReturnType<T>): FetchMockType<T> => {
  return () => ({
    endpoint: request.endpoint,
    method: request.method,
    fixture: mock,
    request,
  });
};
