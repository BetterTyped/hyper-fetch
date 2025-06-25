import { waitFor, act } from "@testing-library/react";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { testErrorState, testSuccessState } from "../../shared";
import { client, createRequest, renderUseFetch, waitForRender } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useFetch [ Offline ]", () => {
  let request = createRequest({ offline: true });

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
    request = createRequest({ offline: true });
    client.clear();
  });

  describe("when application is offline", () => {
    it("should not refetch on offline", async () => {
      const mock = mockRequest(request);
      const response = renderUseFetch(request);

      await testSuccessState(mock, response);

      const spy = jest.spyOn(client.adapter, "fetch");

      act(() => {
        client.appManager.setOnline(false);
        response.result.current.refetch();
      });

      expect(spy).toHaveBeenCalledTimes(0);
    });
    it("should finish request when coming back online", async () => {
      client.appManager.setOnline(false);

      const mock = mockRequest(request);
      const response = renderUseFetch(request);

      act(() => {
        client.appManager.setOnline(true);
      });
      await testSuccessState(mock, response);
    });
    it("should refetch when coming back online", async () => {
      const spy = jest.fn();
      const mock = mockRequest(request);
      const response = renderUseFetch(request, { refetchOnReconnect: true });
      await testSuccessState(mock, response);

      act(() => {
        response.result.current.onRequestStart(spy);
        client.appManager.setOnline(false);
        client.appManager.setOnline(true);
      });
      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
  });
  describe("when request offline attribute is set to true", () => {
    it("should not emit offline error until request is finished", async () => {
      const mock = mockRequest(request);
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
      const mock = mockRequest(request, { status: 400 });
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
