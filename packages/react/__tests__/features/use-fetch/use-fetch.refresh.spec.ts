import { act } from "@testing-library/react";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { client, createRequest, renderUseFetch, waitForRender } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useFetch [ Refreshing ]", () => {
  const hookOptions = {
    refresh: true,
    refreshTime: 100,
    refetchBlurred: true,
    refetchOnReconnect: true,
    refetchOnBlur: true,
    refetchOnFocus: true,
  };

  let request = createRequest();

  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetMocks();
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
    mockRequest(request);
    const { result } = renderUseFetch(request, hookOptions);

    act(() => {
      result.current.onRequestStart(spy);
    });

    await waitForRender();
    expect(spy).toHaveBeenCalledTimes(1);
    await waitForRender(hookOptions.refreshTime * 1.5);

    expect(spy).toHaveBeenCalledTimes(2);
  });
  it("should refresh blurred tab", async () => {
    const spy = jest.fn();
    mockRequest(request);
    const { result } = renderUseFetch(request, { ...hookOptions, refetchOnBlur: false });

    act(() => {
      result.current.onRequestStart(spy);
      client.appManager.setFocused(false);
    });

    await waitForRender();
    await waitForRender(hookOptions.refreshTime * 1.5);
    expect(spy).toHaveBeenCalledTimes(2);
  });
  it("should not refresh blurred tab", async () => {
    const spy = jest.fn();
    mockRequest(request);
    const { result } = renderUseFetch(request, { ...hookOptions, refetchOnBlur: false, refetchBlurred: false });

    act(() => {
      result.current.onRequestStart(spy);
      client.appManager.setFocused(false);
    });

    await waitForRender();
    await waitForRender(hookOptions.refreshTime * 1.5);
    expect(spy).toHaveBeenCalledTimes(1);
  });
  it("should postpone refresh when invalidation is triggered during countdown", async () => {
    // TODO
  });
  it("should postpone refresh when dependencies change during countdown", async () => {
    // TODO
  });
  it("should stop refreshing when value is changing from true to false", async () => {
    const spy = jest.fn();
    mockRequest(request);
    const { result, rerender } = renderUseFetch(request, hookOptions);

    act(() => {
      result.current.onRequestStart(spy);
    });

    await waitForRender();
    expect(spy).toHaveBeenCalledTimes(1);
    await waitForRender(hookOptions.refreshTime * 1.5);

    expect(spy).toHaveBeenCalledTimes(2);

    act(() => {
      rerender({ refresh: false });
    });

    await waitForRender(hookOptions.refreshTime * 1.5);

    expect(spy).toHaveBeenCalledTimes(2);
  });
  it("should refetch when tab is focused and refetchOnFocus is true", async () => {
    const spy = jest.fn();
    mockRequest(request);
    const { result } = renderUseFetch(request, { ...hookOptions });

    act(() => {
      result.current.onRequestStart(spy);
    });

    await waitForRender();
    expect(spy).toHaveBeenCalledTimes(1);

    // Simulate tab focus
    act(() => {
      client.appManager.setFocused(true);
    });

    await waitForRender();
    expect(spy).toHaveBeenCalledTimes(2);
  });
  it("should not refetch when tab is focused and refetchOnFocus is false", async () => {
    const spy = jest.fn();
    mockRequest(request);
    const { result } = renderUseFetch(request, {
      ...hookOptions,
      refetchOnFocus: false,
    });

    act(() => {
      result.current.onRequestStart(spy);
    });

    await waitForRender();
    expect(spy).toHaveBeenCalledTimes(1);

    // Simulate tab focus
    act(() => {
      client.appManager.setFocused(true);
    });

    await waitForRender();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
