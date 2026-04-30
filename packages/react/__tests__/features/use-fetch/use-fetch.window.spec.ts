import { createHttpMockingServer } from "@hyper-fetch/testing";
import { act, waitFor } from "@testing-library/react";

import { client, createRequest, renderUseFetch, waitForRender } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useFetch [ Basic ]", () => {
  let request = createRequest({ cancelable: true });

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
    vi.resetModules();
    request = createRequest({ cancelable: true });
    client.clear();
  });

  it("should refresh on tab focus", async () => {
    const spy = vi.fn();
    mockRequest(request, { delay: 0 });
    const response = renderUseFetch(request, { refetchOnFocus: true });

    await waitForRender();

    act(() => {
      response.result.current.onRequestStart(spy);
      client.appManager.setFocused(false);
      client.appManager.setFocused(true);
    });
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
  it("should refresh on tab blur", async () => {
    const spy = vi.fn();
    mockRequest(request, { delay: 0 });
    const response = renderUseFetch(request, { refetchOnBlur: true });

    await waitForRender();
    act(() => {
      response.result.current.onRequestStart(spy);
      window.dispatchEvent(new Event("blur"));
    });
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
  it("should not refetch on focus when disabled is true", async () => {
    const spy = vi.fn();
    mockRequest(request, { delay: 0 });
    const response = renderUseFetch(request, { refetchOnFocus: true, disabled: true });

    await waitForRender();

    act(() => {
      response.result.current.onRequestStart(spy);
      client.appManager.setFocused(false);
      client.appManager.setFocused(true);
    });

    await waitForRender();
    expect(spy).not.toHaveBeenCalled();
  });
  it("should not refetch on blur when disabled is true", async () => {
    const spy = vi.fn();
    mockRequest(request, { delay: 0 });
    const response = renderUseFetch(request, { refetchOnBlur: true, disabled: true });

    await waitForRender();

    act(() => {
      response.result.current.onRequestStart(spy);
      window.dispatchEvent(new Event("blur"));
    });

    await waitForRender();
    expect(spy).not.toHaveBeenCalled();
  });
  it("should not refetch on reconnect when disabled is true", async () => {
    const spy = vi.fn();
    mockRequest(request, { delay: 0 });
    const response = renderUseFetch(request, { refetchOnReconnect: true, disabled: true });

    await waitForRender();

    act(() => {
      response.result.current.onRequestStart(spy);
      client.appManager.setOnline(false);
      client.appManager.setOnline(true);
    });

    await waitForRender();
    expect(spy).not.toHaveBeenCalled();
  });
  it("should stop refetching on focus after disabled changes from false to true", async () => {
    const spy = vi.fn();
    mockRequest(request, { delay: 0 });
    const response = renderUseFetch(request, { refetchOnFocus: true, disabled: false });

    await waitForRender();

    act(() => {
      response.result.current.onRequestStart(spy);
    });

    act(() => {
      response.rerender({ disabled: true });
    });

    await waitForRender();

    act(() => {
      client.appManager.setFocused(false);
      client.appManager.setFocused(true);
    });

    await waitForRender();
    expect(spy).not.toHaveBeenCalled();
  });
});
