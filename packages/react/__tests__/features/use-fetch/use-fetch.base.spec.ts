import { act, waitFor } from "@testing-library/react";
import { AdapterInstance, ResponseType, xhrExtra } from "@hyper-fetch/core";
import { createHttpMockingServer, sleep } from "@hyper-fetch/testing";

import { createRequest, renderUseFetch, createCacheData, client } from "../../utils";
import { testSuccessState, testErrorState, testInitialState, testCacheState, testClientIsolation } from "../../shared";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useFetch [ Base ]", () => {
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

  describe("when hook is initialized", () => {
    it("should initialize in loading state", async () => {
      await testClientIsolation(client);
      mockRequest(request);
      const view = renderUseFetch(request);

      testInitialState(view);
    });
    it("should load cached data", async () => {
      await testClientIsolation(client);
      const mock = mockRequest(request);
      const [cache] = createCacheData(request, {
        data: {
          data: mock,
          error: null,
          status: 200,
          success: true,
          extra: xhrExtra,
          responseTimestamp: +new Date(),
          requestTimestamp: +new Date(),
        },
        details: {
          retries: 2,
        },
      });
      const view = renderUseFetch(request);
      await testCacheState(cache, view);
    });
    it("should not load stale cache data", async () => {
      await testClientIsolation(client);
      const timestamp = +new Date() - 11;
      const mock = mockRequest(request, { delay: 50 });
      act(() => {
        createCacheData(request, {
          data: {
            data: mock,
            error: null,
            status: 200,
            success: true,
            extra: xhrExtra,
            responseTimestamp: timestamp,
            requestTimestamp: timestamp,
          },
          details: {
            triggerTimestamp: timestamp,
            responseTimestamp: timestamp,
            requestTimestamp: timestamp,
            retries: 3,
          },
        });
      });

      const view = renderUseFetch(request.setStaleTime(10));

      await testCacheState(
        {
          data: null,
          error: null,
          status: null,
          success: true,
          extra: xhrExtra,
          responseTimestamp: timestamp,
          requestTimestamp: timestamp,
        },
        view,
      );
    });
    it("should allow to use initial data", async () => {
      await testClientIsolation(client);
      const initialResponse: ResponseType<unknown, Error, AdapterInstance> = {
        data: { test: [1, 2, 3] },
        error: null,
        status: 200,
        success: true,
        extra: { headers: { "content-type": "application/json" } },
        responseTimestamp: +new Date(),
        requestTimestamp: +new Date(),
      };
      const view = renderUseFetch(request, { disabled: true, initialResponse });

      expect(view.result.current.data).toEqual(initialResponse.data);
      await testSuccessState(initialResponse.data, view);
    });
    it("should allow to use initial data while requesting", async () => {
      await testClientIsolation(client);
      mockRequest(request);
      const initialResponse: ResponseType<unknown, Error, AdapterInstance> = {
        data: { test: [1, 2, 3] },
        error: null,
        status: 200,
        success: true,
        extra: { headers: { "content-type": "application/json" } },
        responseTimestamp: +new Date(),
        requestTimestamp: +new Date(),
      };
      const view = renderUseFetch(request, { initialResponse });
      expect(view.result.current.data).toEqual(initialResponse.data);
    });
    it("should prefer cache data over initial data", async () => {
      // Todo
    });
    it("should make only one request", async () => {
      const spy = jest.spyOn(client.adapter, "fetch");
      await testClientIsolation(client);
      const mock = mockRequest(request);
      const view = renderUseFetch(request);

      await testSuccessState(mock, view);
      await act(async () => {
        await sleep(50);
      });
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
  describe("when hook get success response", () => {
    it("should set state with success data", async () => {
      await testClientIsolation(client);
      const mock = mockRequest(request);
      const view = renderUseFetch(request);

      await testSuccessState(mock, view);
    });
    it("should map the data on deps change", async () => {
      mockRequest(request);
      const request1 = request.setCacheKey("request1").setResponseMapper((response) => ({ ...response, data: 1 }));
      const request2 = request.setCacheKey("request2").setResponseMapper((response) => ({ ...response, data: 2 }));

      const { result, rerender } = renderUseFetch(request1);

      act(() => {
        rerender({ request: request2 });
        rerender({ request: request1 });
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.data).toBe(1);
        expect(result.current.error).toBe(null);
      });

      act(() => {
        rerender({ request: request2 });
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.data).toBe(2);
        expect(result.current.error).toBe(null);
      });
    });
    it("should clear previous error state once success response is returned", async () => {
      await testClientIsolation(client);
      const errorMock = mockRequest(request, { status: 400 });
      const view = renderUseFetch(request);

      await testErrorState(errorMock, view);
      const mock = mockRequest(request);

      act(() => {
        view.result.current.refetch();
      });

      await testSuccessState(mock, view);
    });
    it("should change loading to false on success", async () => {
      // Todo
    });
    it("should map response data", async () => {
      const mappedData = { test: 1, test2: 2, test3: 3 };
      const mappedRequest = request.setResponseMapper((response) => ({
        ...response,
        data: mappedData,
      }));
      mockRequest(mappedRequest);
      const view = renderUseFetch(mappedRequest);

      await testSuccessState(mappedData, view);
    });
    it("should map async response data", async () => {
      const spy = jest.fn();
      const mappedData = { test: 1, test2: 2, test3: 3 };
      const mappedRequest = request.setResponseMapper(async (response) => ({
        ...response,
        data: mappedData,
      }));
      mockRequest(mappedRequest);
      const view = renderUseFetch(mappedRequest, { disabled: true });

      act(() => {
        view.result.current.onSuccess(() => {
          expect(view.result.current.data).toEqual(null);
          spy();
        });
        view.rerender({ disabled: false });
      });

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
      await testSuccessState(mappedData, view);
    });
  });
  describe("when hook get error response", () => {
    it("should set state with error data", async () => {
      await testClientIsolation(client);
      const mock = mockRequest(request, { status: 400 });
      const view = renderUseFetch(request);

      await testErrorState(mock, view);
    });
    it("should keep previous success state once error response is returned", async () => {
      await testClientIsolation(client);
      const mock = mockRequest(request);
      const view = renderUseFetch(request);

      await testSuccessState(mock, view);

      const errorMock = mockRequest(request, { status: 400 });

      act(() => {
        view.result.current.refetch();
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
      const mock = mockRequest(request);
      const view = renderUseFetch(request, { disabled: true });

      act(() => {
        view.result.current.onRequestStart(spy);
      });

      await sleep(20);
      expect(spy).toHaveBeenCalledTimes(0);

      view.rerender({ disabled: false });

      await testSuccessState(mock, view);
      expect(spy).toHaveBeenCalledTimes(1);
    });
    it("should fetch when dependencies change", async () => {
      // Todo
    });
  });
});
