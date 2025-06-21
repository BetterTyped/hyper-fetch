import { act, waitFor } from "@testing-library/react";
import { createHttpMockingServer } from "@hyper-fetch/testing";

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
    jest.resetModules();
    request = createRequest({ cancelable: true });
    client.clear();
  });

  it("should refresh on tab focus", async () => {
    const spy = jest.fn();
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
    const spy = jest.fn();
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
});
