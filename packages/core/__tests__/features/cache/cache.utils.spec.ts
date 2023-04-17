import { getCacheData, getCacheIdKey, getCacheKey, getRevalidateEventKey } from "cache";
import { BaseAdapterType, ResponseReturnErrorType, ResponseReturnSuccessType } from "adapter";
import { ResponseDetailsType } from "managers";

describe("Cache [ Utils ]", () => {
  describe("when getCacheData function is used", () => {
    it("should not override cache on retry or refresh error response", async () => {
      const previousResponse = { data: {}, error: null, status: 200, additionalData: {} } as ResponseReturnSuccessType<
        Record<string, string>,
        BaseAdapterType
      >;
      const errorResponse: ResponseReturnErrorType<Record<string, string>, BaseAdapterType> & ResponseDetailsType = {
        data: null,
        error: {},
        status: 400,
        isSuccess: false,
        additionalData: {},
        retries: 0,
        timestamp: +new Date(),
        isCanceled: false,
        isOffline: false,
      };

      expect(getCacheData(previousResponse, errorResponse)).toStrictEqual({
        data: previousResponse.data,
        error: errorResponse.error,
        status: errorResponse.status,
        isSuccess: errorResponse.isSuccess,
        additionalData: errorResponse.additionalData,
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
        isSuccess: true,
        additionalData: {},
        retries: 0,
        timestamp: +new Date(),
        isCanceled: false,
        isOffline: false,
      } as ResponseReturnSuccessType<Record<string, string>, BaseAdapterType> & ResponseDetailsType;
      const newResponse = {
        data: { test: "2" },
        error: null,
        status: 200,
        isSuccess: true,
        additionalData: {},
        retries: 0,
        timestamp: +new Date(),
        isCanceled: false,
        isOffline: false,
      } as ResponseReturnSuccessType<Record<string, string>, BaseAdapterType> & ResponseDetailsType;
      expect(getCacheData(previousResponse, newResponse)).toStrictEqual(newResponse);
    });

    it("should use any response if there is no cached data", async () => {
      const newResponse = {
        data: {},
        error: null,
        status: 200,
        isSuccess: true,
        additionalData: {},
        retries: 0,
        timestamp: +new Date(),
        isCanceled: false,
        isOffline: false,
      } as ResponseReturnSuccessType<Record<string, string>, BaseAdapterType> & ResponseDetailsType;
      const errorResponse = {
        data: null,
        error: {},
        status: 400,
        isSuccess: false,
        additionalData: {},
        retries: 0,
        timestamp: +new Date(),
        isCanceled: false,
        isOffline: false,
      } as ResponseReturnErrorType<Record<string, string>, BaseAdapterType> & ResponseDetailsType;
      expect(getCacheData(undefined, newResponse)).toStrictEqual(newResponse);
      expect(getCacheData(undefined, errorResponse)).toStrictEqual(errorResponse);
    });
  });
  describe("when key getters are triggered", () => {
    it("should get proper key from getRevalidateEventKey", async () => {
      expect(getRevalidateEventKey("1")).toBe("1_revalidate");
    });
    it("should get proper key from getCacheKey", async () => {
      expect(getCacheKey("1")).toBe("1_cache");
    });
    it("should get proper key from getCacheIdKey", async () => {
      expect(getCacheIdKey("1")).toBe("1_cache_by_id");
    });
  });
});
