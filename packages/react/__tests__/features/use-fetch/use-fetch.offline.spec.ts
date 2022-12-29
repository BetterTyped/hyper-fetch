import { waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";

import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { testErrorState, testSuccessState } from "../../shared";
import { client, createRequest, renderUseFetch, waitForRender } from "../../utils";

describe("useFetch [ Offline ]", () => {
  let request = createRequest({ offline: true });

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
    request = createRequest({ offline: true });
    client.clear();
  });

  describe("when application is offline", () => {
    it("should not revalidate on offline", async () => {
      const mock = createRequestInterceptor(request);
      const response = renderUseFetch(request);

      await testSuccessState(mock, response);

      const spy = jest.spyOn(client, "adapter");

      act(() => {
        client.appManager.setOnline(false);
        response.result.current.revalidate();
      });

      expect(spy).toBeCalledTimes(0);
    });
    it("should finish request when coming back online", async () => {
      client.appManager.setOnline(false);

      const mock = createRequestInterceptor(request);
      const response = renderUseFetch(request);

      act(() => {
        client.appManager.setOnline(true);
      });
      await testSuccessState(mock, response);
    });
    it("should refetch when coming back online", async () => {
      const spy = jest.fn();
      const mock = createRequestInterceptor(request);
      const response = renderUseFetch(request, { refreshOnReconnect: true });
      await testSuccessState(mock, response);

      act(() => {
        response.result.current.onRequestStart(spy);
        client.appManager.setOnline(false);
        client.appManager.setOnline(true);
      });
      await waitFor(() => {
        expect(spy).toBeCalledTimes(1);
      });
    });
  });
  describe("when request offline attribute is set to true", () => {
    it("should not emit offline error until request is finished", async () => {
      const mock = createRequestInterceptor(request);
      const response = renderUseFetch(request);
      await waitForRender();
      act(() => {
        client.appManager.setOnline(false);
      });
      await waitForRender();
      act(() => {
        client.appManager.setOnline(true);
      });
      await testSuccessState(mock, response);
    });
  });
  describe("when request offline attribute is set to false", () => {
    it("should emit offline error until request is finished", async () => {
      const mock = createRequestInterceptor(request, { status: 400 });
      const response = renderUseFetch(request.setOffline(false));
      await waitForRender();
      act(() => {
        client.appManager.setOnline(false);
      });
      await waitForRender();
      act(() => {
        client.appManager.setOnline(true);
      });
      await testErrorState(mock, response);
    });
  });
});
