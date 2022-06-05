import { CommandInstance } from "command";
import { ExtractResponse } from "types";

export type FetchMockType<T> = () => {
  endpoint: string;
  method: string;
  fixture: ApiReturnType<T>;
  request: CommandInstance;
};

export type ApiReturnType<T> = T extends CommandInstance ? ExtractResponse<T> : never;

export const buildMock = <T extends CommandInstance>(request: T, mock: ApiReturnType<T>): FetchMockType<T> => {
  return () => ({
    endpoint: request.endpoint,
    method: request.method,
    fixture: mock,
    request,
  });
};
