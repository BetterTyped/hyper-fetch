import { getCacheData, getCacheIdKey, getCacheKey, getRevalidateEventKey } from "cache";
import { AdapterAdditionalDataType, ResponseErrorType, ResponseSuccessType } from "adapter";

describe("Cache [ Utils ]", () => {
  describe("when getCacheData function is used", () => {
    it("should not override cache on retry or refresh error response", async () => {
      const previousResponse = { data: {}, error: null, additionalData: { status: 200 } } as ResponseSuccessType<
        Record<string, string>,
        AdapterAdditionalDataType
      >;
      const errorResponse = { data: null, error: {}, additionalData: { status: 400 } } as ResponseErrorType<
        Record<string, string>,
        AdapterAdditionalDataType
      >;
      expect(getCacheData(previousResponse, errorResponse)).toStrictEqual({
        data: previousResponse.data,
        error: errorResponse.error,
        additionalData: errorResponse.additionalData,
      });
    });

    it("should use successful response over previous data", async () => {
      const previousResponse = {
        data: { test: "1" },
        error: null,
        additionalData: { status: 200 },
      } as ResponseSuccessType<Record<string, string>, AdapterAdditionalDataType>;
      const newResponse = { data: { test: "2" }, error: null, additionalData: { status: 200 } } as ResponseSuccessType<
        Record<string, string>,
        AdapterAdditionalDataType
      >;
      expect(getCacheData(previousResponse, newResponse)).toStrictEqual(newResponse);
    });

    it("should use any response if there is no cached data", async () => {
      const newResponse = { data: {}, error: null, additionalData: { status: 200 } } as ResponseSuccessType<
        Record<string, string>,
        AdapterAdditionalDataType
      >;
      const errorResponse = { data: null, error: {}, additionalData: { status: 400 } } as ResponseErrorType<
        Record<string, string>,
        AdapterAdditionalDataType
      >;
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
