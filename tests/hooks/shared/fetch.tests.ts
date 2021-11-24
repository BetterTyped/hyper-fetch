import { RenderHookResult } from "@testing-library/react-hooks/dom";

import { UseFetchReturnType } from "hooks";
import { FetchMiddlewareInstance } from "middleware";
import { getCurrentState } from "../utils";

export const testFetchInitialState = <H extends RenderHookResult<any, any, any>>(render: H): void => {
  const response = getCurrentState(render);

  expect(response.status).toEqual(null);
  expect(response.loading).toEqual(true);
  expect(response.data).toEqual(null);
  expect(response.error).toEqual(null);
};

export const testFetchSuccessState = <
  T extends UseFetchReturnType<FetchMiddlewareInstance>,
  H extends RenderHookResult<any, any, any>,
>(
  mock: T["data"],
  render: H,
): void => {
  const response = getCurrentState(render);
  const status = response.status || 0;

  expect(status).toBe(200);
  expect(response.loading).toEqual(false);
  expect(response.data).toMatchObject(mock as Record<string, unknown>);
  expect(response.error).toEqual(null);
};

export const testFetchErrorState = <
  T extends UseFetchReturnType<FetchMiddlewareInstance>,
  H extends RenderHookResult<any, any, any>,
>(
  mock: T["error"],
  render: H,
): void => {
  const response = getCurrentState(render);
  const status = response.status || 0;

  expect(status >= 400 && status < 600).toBeTruthy();
  expect(response.loading).toEqual(false);
  expect(response.data).toEqual(null);
  expect(response.error).toMatchObject(mock);
};

export const testRefreshFetchSuccessState = <
  T extends UseFetchReturnType<FetchMiddlewareInstance>,
  H extends RenderHookResult<any, any, any>,
>(
  mock: T["data"],
  render: H,
): void => {
  const response = getCurrentState(render);
  const status = response.status || 0;

  expect(status >= 200 && status < 300).toBeTruthy();
  expect(response.isRefreshed).toEqual(true);
  expect(response.loading).toEqual(false);
  expect(response.data).toMatchObject(mock as Record<string, unknown>);
  expect(response.error).toEqual(null);
};

export const testRefreshFetchErrorState = <
  T extends UseFetchReturnType<FetchMiddlewareInstance>,
  H extends RenderHookResult<any, any, any>,
>(
  mock: T["data"],
  render: H,
): void => {
  const response = getCurrentState(render);
  const status = response.status || 0;

  expect(status >= 200 && status < 300).toBeTruthy();
  expect(response.isRefreshed).toEqual(true);
  expect(response.refreshError).toEqual(mock);
  expect(response.loading).toEqual(false);
  expect(response.error).toEqual(null);
};
