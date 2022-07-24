import { act, waitFor } from "@testing-library/react";

import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { builder, createCommand, renderUseFetch, waitForRender } from "../../utils";

describe("useFetch [ Basic ]", () => {
  let command = createCommand({ cancelable: true });

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
    command = createCommand({ cancelable: true });
    builder.clear();
  });

  it("should refresh on tab focus", async () => {
    const spy = jest.fn();
    createRequestInterceptor(command, { delay: 0 });
    const response = renderUseFetch(command, { refreshOnFocus: true });

    await waitForRender();

    act(() => {
      response.result.current.onRequestStart(spy);
      builder.appManager.setFocused(false);
      builder.appManager.setFocused(true);
    });
    await waitFor(() => {
      expect(spy).toBeCalledTimes(1);
    });
  });
  it("should refresh on tab blur", async () => {
    const spy = jest.fn();
    createRequestInterceptor(command, { delay: 0 });
    const response = renderUseFetch(command, { refreshOnBlur: true });

    await waitForRender();
    act(() => {
      response.result.current.onRequestStart(spy);
      window.dispatchEvent(new Event("blur"));
    });
    await waitFor(() => {
      expect(spy).toBeCalledTimes(1);
    });
  });
});
