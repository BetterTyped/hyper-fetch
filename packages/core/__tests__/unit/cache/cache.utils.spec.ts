import { getCacheData, stringify } from "cache";
import { ClientResponseErrorType, ClientResponseSuccessType } from "client";

describe("Cache utils", () => {
  describe("Util function: getCacheData", () => {
    it("should not override cache on retry or refresh error response", async () => {
      const previousResponse = [{}, null, 200] as ClientResponseSuccessType<Record<string, string>>;
      const errorResponse = [null, {}, 400] as ClientResponseErrorType<Record<string, string>>;
      expect(getCacheData(previousResponse, errorResponse, {}, null)).toBe(previousResponse);
      expect(getCacheData(previousResponse, errorResponse, null, {})).toBe(previousResponse);
    });

    it("should use successful response over previous data", async () => {
      const previousResponse = [{}, null, 200] as ClientResponseSuccessType<Record<string, string>>;
      const newResponse = [{}, null, 200] as ClientResponseSuccessType<Record<string, string>>;
      expect(getCacheData(previousResponse, newResponse, null, null)).toBe(newResponse);
    });

    it("should use any response if there is no cached data", async () => {
      const newResponse = [{}, null, 200] as ClientResponseSuccessType<Record<string, string>>;
      const errorResponse = [null, {}, 400] as ClientResponseErrorType<Record<string, string>>;
      expect(getCacheData(undefined, newResponse, null, null)).toBe(newResponse);
      expect(getCacheData(undefined, errorResponse, null, null)).toBe(errorResponse);
      expect(getCacheData(undefined, errorResponse, {}, null)).toBe(errorResponse);
      expect(getCacheData(undefined, errorResponse, null, {})).toBe(errorResponse);
    });
  });

  describe("Util function: stringify", () => {
    it("should stringify valid values", async () => {
      const response = { something: 123 };
      const someString = "123";
      expect(stringify(response)).toBe(JSON.stringify(response));
      expect(stringify(someString)).toBe(someString);
      expect(stringify(undefined)).toBe("");
      expect(stringify(null)).toBe("");
    });

    it("should not stringify invalid values", async () => {
      expect(stringify(() => null)).toBe("");
    });
  });
});
