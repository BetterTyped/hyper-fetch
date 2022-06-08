import { waitFor, RenderHookResult } from "@testing-library/react";
import { ClientResponseType, ExtractResponse, CommandInstance } from "@better-typed/hyper-fetch";

import { UseFetchReturnType } from "use-fetch";
import { getCurrentState } from "../utils";

export const testInitialState = <H extends RenderHookResult<any, any>>(render: H) => {
  const response = getCurrentState(render);
  expect(response.data).toBe(null);
  expect(response.status).toBe(null);
  expect(response.error).toBe(null);
  expect(response.loading).toBe(false);
};

export const testSuccessState = async <
  T extends UseFetchReturnType<CommandInstance>,
  H extends RenderHookResult<any, any>,
>(
  mock: T["data"],
  render: H,
) => {
  await waitFor(() => {
    const response = getCurrentState(render);
    expect(response.data).toStrictEqual(mock as Record<string, unknown>);
    expect(response.data).toBeDefined();
    expect(response.status).toBe(200);
    expect(response.loading).toBe(false);
    expect(response.error).toBe(null);
  });
};

export const testErrorState = async <
  T extends UseFetchReturnType<CommandInstance>,
  H extends RenderHookResult<any, any>,
>(
  mock: T["error"],
  render: H,
  data: ExtractResponse<T> | null = null,
) => {
  await waitFor(() => {
    const response = getCurrentState(render);
    const status = response.status || 0;
    expect(response.error).toStrictEqual(mock);
    expect(response.error).toBeDefined();
    expect((status >= 400 && status < 600) || status === 0).toBeTruthy();
    expect(response.loading).toBe(false);
    expect(response.data).toStrictEqual(data);
  });
};

export const testCacheState = async <T extends ClientResponseType<any, any>, H extends RenderHookResult<any, any>>(
  mock: T,
  render: H,
) => {
  await waitFor(() => {
    const response = getCurrentState(render);
    expect(response.data).toStrictEqual(mock[0]);
    expect(response.error).toStrictEqual(mock[1]);
    expect(response.status).toBe(mock[2]);
  });
};
