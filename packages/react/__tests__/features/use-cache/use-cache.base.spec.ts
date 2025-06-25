import { act } from "@testing-library/react";
import { CacheValueType } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";

import { client, createRequest } from "../../utils";
import { renderUseCache } from "../../utils/use-cache.utils";
import { testInitialState, testSuccessState } from "../../shared";

const { resetMocks, startServer, stopServer } = createHttpMockingServer();

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
      },
    },
    retries: 0,
    requestTimestamp: +new Date(),
    responseTimestamp: +new Date(),
    addedTimestamp: +new Date(),
    triggerTimestamp: +new Date(),
    cacheKey: request.cacheKey,
    isCanceled: false,
    isOffline: false,
    staleTime: request.staleTime,
    version: request.client.cache.version,
    cacheTime: Infinity,
  };

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
        expect(+(response.result.current?.responseTimestamp || 0)).toBe(cacheData.responseTimestamp);
        expect(+(response.result.current?.requestTimestamp || 0)).toBe(cacheData.requestTimestamp);
        expect(response.result.current.retries).toBe(0);
      });
      it("should allow to invalidate by Request", async () => {
        const spy = jest.spyOn(client.cache, "invalidate");

        const { result } = renderUseCache(request);

        act(() => {
          result.current.invalidate(request);
        });

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(request);
      });
      it("should allow to invalidate by RegExp", async () => {
        const spy = jest.spyOn(client.cache, "invalidate");

        const { result } = renderUseCache(request);

        act(() => {
          result.current.invalidate(new RegExp(request.cacheKey));
        });

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(new RegExp(request.cacheKey));
      });
      it("should allow to invalidate by cacheKey", async () => {
        const spy = jest.spyOn(client.cache, "invalidate");

        const { result } = renderUseCache(request);

        act(() => {
          result.current.invalidate(request.cacheKey);
        });

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(request.cacheKey);
      });
      it("should allow to invalidate by default key", async () => {
        const spy = jest.spyOn(client.cache, "invalidate");

        const { result } = renderUseCache(request);

        act(() => {
          result.current.invalidate();
        });

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(request.cacheKey);
      });
    });
  });
});
