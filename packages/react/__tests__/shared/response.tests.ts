import { waitFor } from "@testing-library/react";
import { RenderHookResult } from "@testing-library/react-hooks/dom";
import { FetchCommandInstance } from "@better-typed/hyper-fetch";

import { UseFetchReturnType } from "use-fetch";
import { getCurrentState } from "../utils";

export const testInitialState = async <H extends RenderHookResult<any, any, any>>(render: H) => {
  const response = getCurrentState(render);

  await waitFor(() => {
    expect(response.data).toStrictEqual(null);
    expect(response.status).toStrictEqual(null);
    expect(response.error).toStrictEqual(null);
  });
};

export const testSuccessState = async <
  T extends UseFetchReturnType<FetchCommandInstance>,
  H extends RenderHookResult<any, any, any>,
>(
  mock: T["data"],
  render: H,
) => {
  const response = getCurrentState(render);

  await waitFor(() => {
    expect(response.data).toMatchObject(mock as Record<string, unknown>);
    expect(response.status).toBe(200);
    expect(response.loading).toStrictEqual(false);
    expect(response.error).toStrictEqual(null);
  });
};

export const testErrorState = async <
  T extends UseFetchReturnType<FetchCommandInstance>,
  H extends RenderHookResult<any, any, any>,
>(
  mock: T["error"],
  render: H,
) => {
  const response = getCurrentState(render);
  const status = response.status || 0;

  await waitFor(() => {
    expect(response.error).toMatchObject(mock);
    expect(status >= 400 && status < 600).toBeTruthy();
    expect(response.loading).toStrictEqual(false);
    expect(response.data).toStrictEqual(null);
  });
};

export const testSuccessRefreshState = async <
  T extends UseFetchReturnType<FetchCommandInstance>,
  H extends RenderHookResult<any, any, any>,
>(
  mock: T["data"],
  render: H,
) => {
  const response = getCurrentState(render);

  await waitFor(() => {
    testSuccessState(mock, render);
    expect(response.isRefreshed).toStrictEqual(true);
  });
};

export const testErrorFetchState = async <
  T extends UseFetchReturnType<FetchCommandInstance>,
  H extends RenderHookResult<any, any, any>,
>(
  mock: T["data"],
  render: H,
) => {
  const response = getCurrentState(render);

  await waitFor(() => {
    testErrorState(mock, render);
    expect(response.isRefreshed).toStrictEqual(true);
  });
};
