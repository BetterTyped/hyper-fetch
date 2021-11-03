import { UseFetchReturnType } from "hooks";
import { FetchMiddlewareInstance } from "middleware";

export const testFetchInitialState = <T extends UseFetchReturnType<FetchMiddlewareInstance>>(response: T): void => {
  expect(response.status).toEqual(null);
  expect(response.loading).toEqual(true);
  expect(response.data).toEqual(null);
  expect(response.error).toEqual(null);
};

export const testFetchSuccessState = <T extends UseFetchReturnType<FetchMiddlewareInstance>>(
  mock: T["data"],
  response: T,
): void => {
  const status = response.status || 0;
  expect(status >= 200 && status < 300).toBeTruthy();
  expect(response.loading).toEqual(false);
  expect(response.data).toMatchObject(mock as Record<string, unknown>);
  expect(response.error).toEqual(null);
};

export const testFetchErrorState = <T extends UseFetchReturnType<FetchMiddlewareInstance>>(
  mock: T["error"],
  response: T,
): void => {
  const status = response.status || 0;
  expect(status >= 400 && status < 600).toBeTruthy();
  expect(response.loading).toEqual(false);
  expect(response.data).toEqual(null);
  expect(response.error).toMatchObject(mock);
};
