import { act } from "react-dom/test-utils";
import { CacheValueType } from "@better-typed/hyper-fetch";

import { startServer, resetInterceptors, stopServer } from "../../server";
import { builder, createCommand } from "../../utils";
import { renderUseCache } from "../../utils/use-cache.utils";
import { testInitialState, testSuccessState } from "../../shared";

describe("useCache [ Base ]", () => {
  let command = createCommand();
  const cacheData: CacheValueType = {
    data: [{ test: 1 }, null, 200],
    details: {
      retries: 0,
      timestamp: +new Date(),
      isFailed: false,
      isCanceled: false,
      isOffline: false,
    },
    cacheTime: command.cacheTime,
    clearKey: command.builder.cache.clearKey,
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
    builder.clear();
    command = createCommand();
  });

  describe("given hook is mounting", () => {
    describe("when cache data read is pending", () => {
      it("should initialize with non-loading state", async () => {
        const { result } = renderUseCache(command);

        expect(result.current.loading).toBeFalse();
      });
    });
  });
  describe("given cache is empty", () => {
    describe("when reading the state", () => {
      it("should return empty state", async () => {
        const response = renderUseCache(command);

        testInitialState(response, false);
      });
    });
  });
  describe("given cache is present", () => {
    describe("when reading the state", () => {
      it("should return state", async () => {
        builder.cache.set(command, cacheData.data, cacheData.details);
        const response = renderUseCache(command);

        await testSuccessState(cacheData.data[0], response);
        expect(+response.result.current.timestamp).toBe(cacheData.details.timestamp);
        expect(response.result.current.retries).toBe(0);
      });
      it("should allow to revalidate by Command", async () => {
        const spy = jest.spyOn(builder.cache, "revalidate");

        const { result } = renderUseCache(command);

        act(() => {
          result.current.revalidate(command);
        });

        expect(spy).toBeCalledTimes(1);
        expect(spy).toBeCalledWith(command.cacheKey);
      });
      it("should allow to revalidate by RegExp", async () => {
        const spy = jest.spyOn(builder.cache, "revalidate");

        const { result } = renderUseCache(command);

        act(() => {
          result.current.revalidate(new RegExp(command.cacheKey));
        });

        expect(spy).toBeCalledTimes(1);
        expect(spy).toBeCalledWith(new RegExp(command.cacheKey));
      });
      it("should allow to revalidate by cacheKey", async () => {
        const spy = jest.spyOn(builder.cache, "revalidate");

        const { result } = renderUseCache(command);

        act(() => {
          result.current.revalidate(command.cacheKey);
        });

        expect(spy).toBeCalledTimes(1);
        expect(spy).toBeCalledWith(command.cacheKey);
      });
      it("should allow to revalidate by default key", async () => {
        const spy = jest.spyOn(builder.cache, "revalidate");

        const { result } = renderUseCache(command);

        act(() => {
          result.current.revalidate();
        });

        expect(spy).toBeCalledTimes(1);
        expect(spy).toBeCalledWith(command.cacheKey);
      });
    });
  });
});
