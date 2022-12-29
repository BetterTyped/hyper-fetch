import { act } from "@testing-library/react";

import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { client, createRequest, renderUseFetch, waitForRender } from "../../utils";

describe("useFetch [ Refreshing ]", () => {
  const hookOptions = {
    refresh: true,
    refreshTime: 100,
    refreshBlurred: true,
    refreshOnReconnect: true,
    refreshOnBlur: true,
    refreshOnFocus: true,
  };

  let request = createRequest();

  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetInterceptors();
  });

  afterAll(() => {
    stopServer();
  });

  beforeEach(() => {
    jest.resetModules();
    request = createRequest();
    client.clear();
  });

  it("should refetch data after refresh time of 200ms", async () => {
    const spy = jest.fn();
    createRequestInterceptor(request);
    const { result } = renderUseFetch(request, hookOptions);

    act(() => {
      result.current.onRequestStart(spy);
    });

    await waitForRender();
    expect(spy).toBeCalledTimes(1);
    await waitForRender(hookOptions.refreshTime * 1.5);

    expect(spy).toBeCalledTimes(2);
  });
  it("should refresh blurred tab", async () => {
    const spy = jest.fn();
    createRequestInterceptor(request);
    const { result } = renderUseFetch(request, { ...hookOptions, refreshOnBlur: false });

    act(() => {
      result.current.onRequestStart(spy);
      client.appManager.setFocused(false);
    });

    await waitForRender();
    await waitForRender(hookOptions.refreshTime * 1.5);
    expect(spy).toBeCalledTimes(2);
  });
  it("should not refresh blurred tab", async () => {
    const spy = jest.fn();
    createRequestInterceptor(request);
    const { result } = renderUseFetch(request, { ...hookOptions, refreshOnBlur: false, refreshBlurred: false });

    act(() => {
      result.current.onRequestStart(spy);
      client.appManager.setFocused(false);
    });

    await waitForRender();
    await waitForRender(hookOptions.refreshTime * 1.5);
    expect(spy).toBeCalledTimes(1);
  });
  it("should postpone refresh when revalidation is triggered during countdown", async () => {
    // TODO
  });
  it("should postpone refresh when dependencies change during countdown", async () => {
    // TODO
  });
});
