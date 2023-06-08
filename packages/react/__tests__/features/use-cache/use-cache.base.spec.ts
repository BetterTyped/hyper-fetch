import { act } from "react-dom/test-utils";
import { CacheValueType } from "@hyper-fetch/core";

import { startServer, resetInterceptors, stopServer } from "../../server";
import { client, createRequest } from "../../utils";
import { renderUseCache } from "../../utils/use-cache.utils";
import { testInitialState, testSuccessState } from "../../shared";

describe("useCache [ Base ]", () => {
  let request = createRequest();
  const cacheData: CacheValueType = {
    data: { test: 1 },
    error: null,
    status: 200,
    success: true,
    extra: {
      headers: {
        "content-type": "application/json",
        "x-powered-by": "msw",
      },
    },
    retries: 0,
    timestamp: +new Date(),
    isCanceled: false,
    isOffline: false,
    cacheTime: request.cacheTime,
    clearKey: request.client.cache.clearKey,
    garbageCollection: Infinity,
  };

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
    client.clear();
    request = createRequest();
  });

  describe("given hook is mounting", () => {
    describe("when cache data read is pending", () => {
      it("should initialize with non-loading state", async () => {
        const { result } = renderUseCache(request);

        expect(result.current.loading).toBeFalse();
      });
    });
  });
  describe("given cache is empty", () => {
    describe("when reading the state", () => {
      it("should return empty state", async () => {
        const response = renderUseCache(request);

        testInitialState(response, false);
      });
    });
  });
  describe("given cache is present", () => {
    describe("when reading the state", () => {
      it("should return state", async () => {
        client.cache.set(request, cacheData);
        const response = renderUseCache(request);

        await testSuccessState(cacheData.data, response);
        expect(+response.result.current.timestamp).toBe(cacheData.timestamp);
        expect(response.result.current.retries).toBe(0);
      });
      it("should allow to invalidate by Request", async () => {
        const spy = jest.spyOn(client.cache, "invalidate");

        const { result } = renderUseCache(request);

        act(() => {
          result.current.refetch(request);
        });

        expect(spy).toBeCalledTimes(1);
        expect(spy).toBeCalledWith(request.cacheKey);
      });
      it("should allow to invalidate by RegExp", async () => {
        const spy = jest.spyOn(client.cache, "invalidate");

        const { result } = renderUseCache(request);

        act(() => {
          result.current.refetch(new RegExp(request.cacheKey));
        });

        expect(spy).toBeCalledTimes(1);
        expect(spy).toBeCalledWith(new RegExp(request.cacheKey));
      });
      it("should allow to invalidate by cacheKey", async () => {
        const spy = jest.spyOn(client.cache, "invalidate");

        const { result } = renderUseCache(request);

        act(() => {
          result.current.refetch(request.cacheKey);
        });

        expect(spy).toBeCalledTimes(1);
        expect(spy).toBeCalledWith(request.cacheKey);
      });
      it("should allow to invalidate by default key", async () => {
        const spy = jest.spyOn(client.cache, "invalidate");

        const { result } = renderUseCache(request);

        act(() => {
          result.current.refetch();
        });

        expect(spy).toBeCalledTimes(1);
        expect(spy).toBeCalledWith(request.cacheKey);
      });
    });
  });
});
