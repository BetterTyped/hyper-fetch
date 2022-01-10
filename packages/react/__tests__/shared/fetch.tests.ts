import { RenderHookResult } from "@testing-library/react-hooks/dom";
import { FetchCommandInstance } from "@better-typed/hyper-fetch";

import { UseFetchReturnType } from "use-fetch";
import { getCurrentState } from "../utils/utils";

export const testFetchInitialState = <H extends RenderHookResult<any, any, any>>(render: H): void => {
  const response = getCurrentState(render);

  expect(response.data).toEqual(null);
  expect(response.status).toEqual(null);
  expect(response.loading).toEqual(true);
  expect(response.error).toEqual(null);
};

export const testFetchSuccessState = <
  T extends UseFetchReturnType<FetchCommandInstance>,
  H extends RenderHookResult<any, any, any>,
>(
  mock: T["data"],
  render: H,
): void => {
  const response = getCurrentState(render);
  const status = response.status || 0;

  expect(response.data).toMatchObject(mock as Record<string, unknown>);
  expect(status).toBe(200);
  expect(response.loading).toEqual(false);
  expect(response.error).toEqual(null);
};

export const testFetchErrorState = <
  T extends UseFetchReturnType<FetchCommandInstance>,
  H extends RenderHookResult<any, any, any>,
>(
  mock: T["error"],
  render: H,
): void => {
  const response = getCurrentState(render);
  const status = response.status || 0;

  expect(response.error).toMatchObject(mock);
  expect(status >= 400 && status < 600).toBeTruthy();
  expect(response.loading).toEqual(false);
  expect(response.data).toEqual(null);
};

export const testRefreshFetchSuccessState = <
  T extends UseFetchReturnType<FetchCommandInstance>,
  H extends RenderHookResult<any, any, any>,
>(
  mock: T["data"],
  render: H,
): void => {
  const response = getCurrentState(render);
  const status = response.status || 0;

  expect(response.data).toMatchObject(mock as Record<string, unknown>);
  expect(status >= 200 && status < 300).toBeTruthy();
  expect(response.isRefreshed).toEqual(true);
  expect(response.loading).toEqual(false);
  expect(response.error).toEqual(null);
};

export const testRefreshFetchErrorState = <
  T extends UseFetchReturnType<FetchCommandInstance>,
  H extends RenderHookResult<any, any, any>,
>(
  mock: T["data"],
  render: H,
): void => {
  const response = getCurrentState(render);
  const status = response.status || 0;

  expect(response.error).toEqual(null);
  expect(status >= 200 && status < 300).toBeTruthy();
  expect(response.isRefreshed).toEqual(true);
  expect(response.refreshError).toEqual(mock);
  expect(response.loading).toEqual(false);
};
