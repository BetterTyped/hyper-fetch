import { act, waitFor } from "@testing-library/react";

import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { client, createRequest, renderUseFetch, waitForRender } from "../../utils";

describe("useFetch [ Basic ]", () => {
  let request = createRequest({ cancelable: true });

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
    request = createRequest({ cancelable: true });
    client.clear();
  });

  it("should refresh on tab focus", async () => {
    const spy = jest.fn();
    createRequestInterceptor(request, { delay: 0 });
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
    const spy = jest.fn();
    createRequestInterceptor(request, { delay: 0 });
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
});
