import { waitFor, RenderHookResult } from "@testing-library/react";
import { ClientResponseType, ExtractResponse, FetchCommandInstance } from "@better-typed/hyper-fetch";

import { UseFetchReturnType } from "use-fetch";
import { getCurrentState } from "../utils";

export const testInitialState = async <H extends RenderHookResult<any, any>>(render: H) => {
  const response = getCurrentState(render);

  await waitFor(() => {
    expect(response.data).toBe(null);
    expect(response.status).toBe(null);
    expect(response.error).toBe(null);
  });
};

export const testSuccessState = async <
  T extends UseFetchReturnType<FetchCommandInstance>,
  H extends RenderHookResult<any, any>,
>(
  mock: T["data"],
  render: H,
) => {
  const response = getCurrentState(render);

  await waitFor(() => {
    expect(response.data).toMatchObject(mock as Record<string, unknown>);
    expect(response.data).toBeDefined();
    expect(response.status).toBe(200);
    expect(response.loading).toBe(false);
    expect(response.error).toBe(null);
  });
};

export const testErrorState = async <
  T extends UseFetchReturnType<FetchCommandInstance>,
  H extends RenderHookResult<any, any>,
>(
  mock: T["error"],
  render: H,
  data: ExtractResponse<T> | null = null,
) => {
  const response = getCurrentState(render);
  const status = response.status || 0;

  await waitFor(() => {
    expect(response.error).toMatchObject(mock);
    expect(response.error).toBeDefined();
    expect(status >= 400 && status < 600).toBeTruthy();
    expect(response.loading).toBe(false);
    expect(response.data).toBe(data);
  });
};

export const testSuccessRefreshState = async <
  T extends UseFetchReturnType<FetchCommandInstance>,
  H extends RenderHookResult<any, any>,
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
  H extends RenderHookResult<any, any>,
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

export const testCacheState = async <T extends ClientResponseType<any, Error>, H extends RenderHookResult<any, any>>(
  mock: T,
  render: H,
) => {
  const response = getCurrentState(render);

  await waitFor(() => {
    expect(response.data).toMatchObject(mock[0]);
    expect(response.data).toBeDefined();
    expect(response.error).toBe(mock[1]);
    expect(response.data).not.toBeDefined();
    expect(response.status).toBe(mock[2]);
  });
};
