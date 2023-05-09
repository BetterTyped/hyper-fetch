import { act } from "@testing-library/react";
import { AdapterType, ResponseReturnType, xhrExtra } from "@hyper-fetch/core";

import { createRequest, renderUseFetch, createCacheData, client, sleep } from "../../utils";
import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { testSuccessState, testErrorState, testInitialState, testCacheState, testClientIsolation } from "../../shared";

describe("useFetch [ Base ]", () => {
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

  describe("when hook is initialized", () => {
    it("should initialize in loading state", async () => {
      await testClientIsolation(client);
      createRequestInterceptor(request);
      const view = renderUseFetch(request);

      testInitialState(view);
    });
    it("should load cached data", async () => {
      await testClientIsolation(client);
      const mock = createRequestInterceptor(request);
      const [cache] = createCacheData(request, {
        data: { data: mock, error: null, status: 200, success: true, extra: xhrExtra },
        details: { retries: 2 },
      });
      const view = renderUseFetch(request);
      await testCacheState(cache, view);
    });
    it("should not load stale cache data", async () => {
      await testClientIsolation(client);
      const timestamp = +new Date() - 11;
      const mock = createRequestInterceptor(request, { delay: 50 });
      act(() => {
        createCacheData(request, {
          data: { data: mock, error: null, status: 200, success: true, extra: xhrExtra },
          details: { timestamp, retries: 3 },
        });
      });

      const view = renderUseFetch(request.setCacheTime(10));

      await testCacheState({ data: null, error: null, status: null, success: true, extra: xhrExtra }, view);
    });
    it("should allow to use initial data", async () => {
      await testClientIsolation(client);
      const initialData: ResponseReturnType<unknown, Error, AdapterType> = {
        data: { test: [1, 2, 3] },
        error: null,
        status: 200,
        success: true,
        extra: { headers: { "content-type": "application/json", "x-powered-by": "msw" } },
      };
      const view = renderUseFetch(request, { disabled: true, initialData });

      await testSuccessState(initialData.data, view);
    });
    it("should prefer cache data over initial data", async () => {
      // Todo
    });
    it("should make only one request", async () => {
      const spy = jest.spyOn(client, "adapter");
      await testClientIsolation(client);
      const mock = createRequestInterceptor(request);
      const view = renderUseFetch(request);

      await testSuccessState(mock, view);
      await act(async () => {
        await sleep(50);
      });
      expect(spy).toBeCalledTimes(1);
    });
  });
  describe("when hook get success response", () => {
    it("should set state with success data", async () => {
      await testClientIsolation(client);
      const mock = createRequestInterceptor(request);
      const view = renderUseFetch(request);

      await testSuccessState(mock, view);
    });
    it("should clear previous error state once success response is returned", async () => {
      await testClientIsolation(client);
      const errorMock = createRequestInterceptor(request, { status: 400 });
      const view = renderUseFetch(request);

      await testErrorState(errorMock, view);
      const mock = createRequestInterceptor(request);

      act(() => {
        view.result.current.revalidate();
      });

      await testSuccessState(mock, view);
    });
    it("should change loading to false on success", async () => {
      // Todo
    });
  });
  describe("when hook get error response", () => {
    it("should set state with error data", async () => {
      await testClientIsolation(client);
      const mock = createRequestInterceptor(request, { status: 400 });
      const view = renderUseFetch(request);

      await testErrorState(mock, view);
    });
    it("should keep previous success state once error response is returned", async () => {
      await testClientIsolation(client);
      const mock = createRequestInterceptor(request);
      const view = renderUseFetch(request);

      await testSuccessState(mock, view);

      const errorMock = createRequestInterceptor(request, { status: 400 });

      act(() => {
        view.result.current.revalidate();
      });

      await testErrorState(errorMock, view, mock);
    });
    it("should change loading to false on error", async () => {
      // Todo
    });
  });
  describe("when dependencies change", () => {
    // Solves Issue #22
    it("should fetch data when disabled prop changes", async () => {
      const spy = jest.fn();
      await testClientIsolation(client);
      const mock = createRequestInterceptor(request);
      const view = renderUseFetch(request, { disabled: true });

      act(() => {
        view.result.current.onRequestStart(spy);
      });

      await sleep(20);
      expect(spy).toBeCalledTimes(0);

      view.rerender({ disabled: false });

      await testSuccessState(mock, view);
      expect(spy).toBeCalledTimes(1);
    });
    it("should fetch when dependencies change", async () => {
      // Todo
    });
  });
});
