import { getCacheData, stringify } from "cache";
import { ClientResponseErrorType, ClientResponseSuccessType } from "client";

describe("Cache utils", () => {
  describe("Util function: getCacheData", () => {
    it("should not override cache on retry or refresh error response", async () => {
      const previousResponse = [{}, null, 200] as ClientResponseSuccessType<Record<string, string>>;
      const errorResponse = [null, {}, 400] as ClientResponseErrorType<Record<string, string>>;
      expect(getCacheData(previousResponse, errorResponse)).toStrictEqual([
        previousResponse[0],
        errorResponse[1],
        errorResponse[2],
      ]);
    });

    it("should use successful response over previous data", async () => {
      const previousResponse = [{ test: "1" }, null, 200] as ClientResponseSuccessType<Record<string, string>>;
      const newResponse = [{ test: "2" }, null, 200] as ClientResponseSuccessType<Record<string, string>>;
      expect(getCacheData(previousResponse, newResponse)).toStrictEqual(newResponse);
    });

    it("should use any response if there is no cached data", async () => {
      const newResponse = [{}, null, 200] as ClientResponseSuccessType<Record<string, string>>;
      const errorResponse = [null, {}, 400] as ClientResponseErrorType<Record<string, string>>;
      expect(getCacheData(undefined, newResponse)).toStrictEqual(newResponse);
      expect(getCacheData(undefined, errorResponse)).toStrictEqual(errorResponse);
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
