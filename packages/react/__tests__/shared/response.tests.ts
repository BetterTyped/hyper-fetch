import { waitFor, RenderHookResult } from "@testing-library/react";
import { ResponseType, RequestInstance, AdapterInstance } from "@hyper-fetch/core";

import { UseFetchReturnType } from "hooks/use-fetch";
import { UseSubmitReturnType } from "hooks/use-submit";
import { getCurrentState } from "../utils";

export const testInitialState = <H extends RenderHookResult<any, any>>(render: H, expectedLoading = true) => {
  const response = getCurrentState(render);
  expect(response.data).toBe(null);
  expect(response.status).toBe(null);
  expect(response.error).toBe(null);
  if (typeof response.submitting === "boolean") {
    expect(response.submitting).toBe(false);
  } else {
    expect(response.loading).toBe(expectedLoading);
  }
};

export const testSuccessState = async <
  T extends UseFetchReturnType<RequestInstance> | UseSubmitReturnType<RequestInstance>,
  H extends RenderHookResult<any, any>,
>(
  mock: T["data"],
  render: H,
) => {
  await waitFor(() => {
    const response = getCurrentState(render);
    expect(response.data).toStrictEqual(mock as Record<string, unknown>);
    expect(response.data).toBeDefined();
    expect(response.success).toBeTrue();
    expect(response.status).toBe(200);
    expect(response.extra).toHaveProperty("headers");
    expect(response.retries).toBeNumber();
    expect(response.timestamp).toBeDate();
    if (typeof response.submitting === "boolean") {
      expect(response.submitting).toBe(false);
    } else {
      expect(response.loading).toBe(false);
    }
    expect(response.error).toBe(null);
  });
};

export const testErrorState = async <
  T extends UseFetchReturnType<RequestInstance>,
  H extends RenderHookResult<any, any>,
>(
  mock: T["error"],
  render: H,
  data: any | null = null,
) => {
  await waitFor(() => {
    const response = getCurrentState(render);
    const status = response.status || 0;
    expect(response.error).toStrictEqual(mock);
    expect(response.error).toBeDefined();
    expect(response.retries).toBeNumber();
    expect(response.timestamp).toBeDate();
    expect(response.success).toBeFalse();
    expect(response.extra).toHaveProperty("headers");
    expect(Object.keys(response.extra)).toHaveLength(1);
    expect((status >= 400 && status < 600) || status === 0).toBeTruthy();
    if (typeof response.submitting === "boolean") {
      expect(response.submitting).toBe(false);
    } else {
      expect(response.loading).toBe(false);
    }
    expect(response.data).toStrictEqual(data);
  });
};

export const testCacheState = async <
  T extends ResponseType<any, any, AdapterInstance>,
  H extends RenderHookResult<any, any>,
>(
  mock: T,
  render: H,
) => {
  await waitFor(() => {
    const response = getCurrentState(render);
    expect(response.data).toStrictEqual(mock.data);
    expect(response.error).toStrictEqual(mock.error);
    expect(response.status).toBe(mock.status);
    expect(response.extra).toStrictEqual(mock.extra);
  });
};

export const testLoading = async <H extends RenderHookResult<any, any>>(mock: boolean, render: H) => {
  await waitFor(() => {
    const response = getCurrentState(render);
    if (typeof response.submitting === "boolean") {
      expect(response.submitting).toBe(mock);
    } else {
      expect(response.loading).toBe(mock);
    }
  });
};

export const testData = async <
  T extends UseFetchReturnType<RequestInstance> | UseSubmitReturnType<RequestInstance>,
  H extends RenderHookResult<any, any>,
>(
  mock: T["data"],
  render: H,
) => {
  await waitFor(() => {
    const response = getCurrentState(render);
    expect(response.data).toStrictEqual(mock as Record<string, unknown>);
  });
};

export const testError = async <
  T extends UseFetchReturnType<RequestInstance> | UseSubmitReturnType<RequestInstance>,
  H extends RenderHookResult<any, any>,
>(
  mock: T["error"],
  render: H,
) => {
  await waitFor(() => {
    const response = getCurrentState(render);
    expect(response.error).toStrictEqual(mock as Record<string, unknown>);
  });
};
