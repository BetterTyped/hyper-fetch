import { getCacheData, getCacheByKey, getInvalidateByKey } from "cache";
import { ResponseErrorType, ResponseSuccessType } from "adapter";
import { ResponseDetailsType } from "managers";
import { HttpAdapterType, xhrExtra } from "http-adapter";

describe("Cache [ Utils ]", () => {
  describe("when getCacheData function is used", () => {
    it("should not override cache on retry or refresh error response", async () => {
      const previousResponse = {
        data: {},
        error: null,
        status: 200,
        extra: xhrExtra,
      } as ResponseSuccessType<Record<string, string>, HttpAdapterType>;
      const errorResponse: ResponseErrorType<Record<string, string>, HttpAdapterType> & ResponseDetailsType = {
        data: null,
        error: {},
        status: 400,
        success: false,
        extra: xhrExtra,
        retries: 0,
        requestTimestamp: +new Date(),
        responseTimestamp: +new Date(),
        addedTimestamp: +new Date(),
        triggerTimestamp: +new Date(),
        isCanceled: false,
        isOffline: false,
      };

      expect(getCacheData(previousResponse, errorResponse)).toStrictEqual({
        data: previousResponse.data,
        error: errorResponse.error,
        status: errorResponse.status,
        success: errorResponse.success,
        extra: errorResponse.extra,
        retries: 0,
        requestTimestamp: expect.toBeNumber(),
        responseTimestamp: expect.toBeNumber(),
        addedTimestamp: expect.toBeNumber(),
        triggerTimestamp: expect.toBeNumber(),
        isCanceled: false,
        isOffline: false,
      } satisfies ReturnType<typeof getCacheData>);
    });

    it("should use successful response over previous data", async () => {
      const previousResponse = {
        data: { test: "1" },
        error: null,
        status: 200,
        success: true,
        extra: xhrExtra,
        retries: 0,
        requestTimestamp: +new Date(),
        responseTimestamp: +new Date(),
        addedTimestamp: +new Date(),
        triggerTimestamp: +new Date(),
        isCanceled: false,
        isOffline: false,
      } as ResponseSuccessType<Record<string, string>, HttpAdapterType> & ResponseDetailsType;
      const newResponse = {
        data: { test: "2" },
        error: null,
        status: 200,
        success: true,
        extra: xhrExtra,
        retries: 0,
        requestTimestamp: +new Date(),
        responseTimestamp: +new Date(),
        addedTimestamp: +new Date(),
        triggerTimestamp: +new Date(),
        isCanceled: false,
        isOffline: false,
      } as ResponseSuccessType<Record<string, string>, HttpAdapterType> & ResponseDetailsType;
      expect(getCacheData(previousResponse, newResponse)).toStrictEqual(newResponse);
    });

    it("should use any response if there is no cached data", async () => {
      const newResponse = {
        data: {},
        error: null,
        status: 200,
        success: true,
        extra: xhrExtra,
        retries: 0,
        requestTimestamp: expect.toBeNumber(),
        responseTimestamp: expect.toBeNumber(),
        addedTimestamp: expect.toBeNumber(),
        triggerTimestamp: expect.toBeNumber(),
        isCanceled: false,
        isOffline: false,
      } as ResponseSuccessType<Record<string, string>, HttpAdapterType> & ResponseDetailsType;
      const errorResponse = {
        data: null,
        error: {},
        status: 400,
        success: false,
        extra: xhrExtra,
        retries: 0,
        requestTimestamp: expect.toBeNumber(),
        responseTimestamp: expect.toBeNumber(),
        addedTimestamp: expect.toBeNumber(),
        triggerTimestamp: expect.toBeNumber(),
        isCanceled: false,
        isOffline: false,
      } as ResponseErrorType<Record<string, string>, HttpAdapterType> & ResponseDetailsType;
      expect(getCacheData(undefined, newResponse)).toStrictEqual(newResponse);
      expect(getCacheData(undefined, errorResponse)).toStrictEqual(errorResponse);
    });
  });
  describe("when key getters are triggered", () => {
    it("should get proper key from getInvalidateByKey", async () => {
      expect(getInvalidateByKey("1")).toBe("1_invalidate");
    });
    it("should get proper key from getCacheByKey", async () => {
      expect(getCacheByKey("1")).toBe("1_cache");
    });
  });
});
