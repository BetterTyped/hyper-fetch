import { getCacheData, getCacheIdKey, getCacheKey, getInvalidateEventKey } from "cache";
import { xhrExtra, AdapterType, ResponseReturnErrorType, ResponseReturnSuccessType } from "adapter";
import { ResponseDetailsType } from "managers";

describe("Cache [ Utils ]", () => {
  describe("when getCacheData function is used", () => {
    it("should not override cache on retry or refresh error response", async () => {
      const previousResponse = {
        data: {},
        error: null,
        status: 200,
        extra: xhrExtra,
      } as ResponseReturnSuccessType<Record<string, string>, AdapterType>;
      const errorResponse: ResponseReturnErrorType<Record<string, string>, AdapterType> & ResponseDetailsType = {
        data: null,
        error: {},
        status: 400,
        success: false,
        extra: xhrExtra,
        retries: 0,
        timestamp: +new Date(),
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
        timestamp: errorResponse.timestamp,
        isCanceled: false,
        isOffline: false,
      });
    });

    it("should use successful response over previous data", async () => {
      const previousResponse = {
        data: { test: "1" },
        error: null,
        status: 200,
        success: true,
        extra: xhrExtra,
        retries: 0,
        timestamp: +new Date(),
        isCanceled: false,
        isOffline: false,
      } as ResponseReturnSuccessType<Record<string, string>, AdapterType> & ResponseDetailsType;
      const newResponse = {
        data: { test: "2" },
        error: null,
        status: 200,
        success: true,
        extra: xhrExtra,
        retries: 0,
        timestamp: +new Date(),
        isCanceled: false,
        isOffline: false,
      } as ResponseReturnSuccessType<Record<string, string>, AdapterType> & ResponseDetailsType;
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
        timestamp: +new Date(),
        isCanceled: false,
        isOffline: false,
      } as ResponseReturnSuccessType<Record<string, string>, AdapterType> & ResponseDetailsType;
      const errorResponse = {
        data: null,
        error: {},
        status: 400,
        success: false,
        extra: xhrExtra,
        retries: 0,
        timestamp: +new Date(),
        isCanceled: false,
        isOffline: false,
      } as ResponseReturnErrorType<Record<string, string>, AdapterType> & ResponseDetailsType;
      expect(getCacheData(undefined, newResponse)).toStrictEqual(newResponse);
      expect(getCacheData(undefined, errorResponse)).toStrictEqual(errorResponse);
    });
  });
  describe("when key getters are triggered", () => {
    it("should get proper key from getInvalidateEventKey", async () => {
      expect(getInvalidateEventKey("1")).toBe("1_invalidate");
    });
    it("should get proper key from getCacheKey", async () => {
      expect(getCacheKey("1")).toBe("1_cache");
    });
    it("should get proper key from getCacheIdKey", async () => {
      expect(getCacheIdKey("1")).toBe("1_cache_by_id");
    });
  });
});
