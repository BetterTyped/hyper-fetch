import { createClient } from "@hyper-fetch/core";

import { getValidCacheData, getInitialState, initialState } from "helpers";
import { isEmpty, isEqual } from "utils";

describe("useTrackedState [ Utils ]", () => {
  describe("when isEmpty gets triggered", () => {
    it("should return true for empty array or object", async () => {
      expect(isEmpty([])).toBe(true);
      expect(isEmpty({})).toBe(true);
    });

    it("should return false", async () => {
      expect(isEmpty(null)).toBe(false);
      expect(isEmpty(new Date())).toBe(false);
      expect(isEmpty(NaN)).toBe(false);
      expect(isEmpty("")).toBe(false);
      expect(isEmpty(false)).toBe(false);
      expect(isEmpty(undefined)).toBe(false);
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(true)).toBe(false);
      expect(isEmpty(123)).toBe(false);
      expect(isEmpty("123")).toBe(false);
      expect(isEmpty([1, 2, 3])).toBe(false);
      expect(isEmpty({ something: 1 })).toBe(false);
    });
  });

  describe("when isEqual gets triggered", () => {
    it("should return false for non equal values", async () => {
      expect(isEqual(true, false)).toBe(false);
      expect(isEqual(null, {})).toBe(false);
      expect(isEqual(new Date(), {})).toBe(false);
      expect(isEqual(new Date(), null)).toBe(false);
      expect(isEqual(NaN, {})).toBe(false);
      expect(isEqual(NaN, null)).toBe(false);
      expect(isEqual("1", 1)).toBe(false);
      expect(isEqual(0, -1)).toBe(false);
      expect(isEqual("2", "3")).toBe(false);
      expect(isEqual([], [1])).toBe(false);
      expect(isEqual([1], [2])).toBe(false);
      expect(isEqual(["1"], [1])).toBe(false);
      expect(isEqual([null], [NaN])).toBe(false);
      expect(isEqual([null], [new Date()])).toBe(false);
      expect(isEqual([null], [{}])).toBe(false);
      expect(isEqual([new Date()], [{}])).toBe(false);
      expect(isEqual([NaN], [{}])).toBe(false);
      expect(isEqual([{ someKey: 1 }], [{ someKey: 2 }])).toBe(false);
      expect(isEqual([{ someKey: "1" }], [{ someKey: 1 }])).toBe(false);
      expect(isEqual([{ someKey: null }], [{ someKey: {} }])).toBe(false);
      expect(isEqual([{ someKey: null }], [{ someKey: NaN }])).toBe(false);
      expect(isEqual([{ someKey: null }], [{ someKey: new Date() }])).toBe(false);
      expect(isEqual([{ someKey: {} }], [{ someKey: new Date() }])).toBe(false);
      expect(isEqual([{ someKey: {} }], [{ someKey: NaN }])).toBe(false);
      expect(isEqual({ someKey: 1 }, { otherKey: 1 })).toBe(false);
      expect(isEqual({ someKey: 1 }, { someKey: 1, otherKey: 1 })).toBe(false);
      expect(isEqual({ someKey: 1 }, { someKey: 2 })).toBe(false);
      expect(isEqual({ someKey: "1" }, { someKey: 1 })).toBe(false);
      expect(isEqual({ someKey: null }, { someKey: {} })).toBe(false);
      expect(isEqual({ someKey: null }, { someKey: NaN })).toBe(false);
      expect(isEqual({ someKey: null }, { someKey: new Date() })).toBe(false);
      expect(isEqual({ someKey: {} }, { someKey: new Date() })).toBe(false);
      expect(isEqual({ someKey: {} }, { someKey: NaN })).toBe(false);
      expect(isEqual({ someKey: 1 }, { otherKey: 1 })).toBe(false);
      expect(isEqual({ someKey: 1 }, { someKey: 1, otherKey: 1 })).toBe(false);
    });

    it("should return true for equal arguments", async () => {
      const date = new Date();

      expect(isEqual(true, true)).toBe(true);
      expect(isEqual(false, false)).toBe(true);
      expect(isEqual(undefined, undefined)).toBe(true);
      expect(isEqual(null, null)).toBe(true);
      expect(isEqual(date, date)).toBe(true);
      expect(isEqual(date, date)).toBe(true);
      expect(isEqual(NaN, NaN)).toBe(true);
      expect(isEqual("1", "1")).toBe(true);
      expect(isEqual(0, 0)).toBe(true);
      expect(isEqual(1, 1)).toBe(true);
      expect(isEqual("2", "2")).toBe(true);
      expect(isEqual([], [])).toBe(true);
      expect(isEqual([1], [1])).toBe(true);
      expect(isEqual(["1"], ["1"])).toBe(true);
      expect(isEqual([NaN], [NaN])).toBe(true);
      expect(isEqual([date], [date])).toBe(true);
      expect(isEqual([null], [null])).toBe(true);
      expect(isEqual([{}], [{}])).toBe(true);
      expect(isEqual([{ someKey: 1 }], [{ someKey: 1 }])).toBe(true);
      expect(isEqual([{ someKey: "1" }], [{ someKey: "1" }])).toBe(true);
      expect(isEqual([{ someKey: null }], [{ someKey: null }])).toBe(true);
      expect(isEqual([{ someKey: NaN }], [{ someKey: NaN }])).toBe(true);
      expect(isEqual([{ someKey: date }], [{ someKey: date }])).toBe(true);
      expect(isEqual([{ someKey: {} }], [{ someKey: {} }])).toBe(true);
      expect(isEqual({ someKey: 1, otherKey: 1 }, { someKey: 1, otherKey: 1 })).toBe(true);
      expect(isEqual({ someKey: "1" }, { someKey: "1" })).toBe(true);
      expect(isEqual({ someKey: {} }, { someKey: {} })).toBe(true);
      expect(isEqual({ someKey: NaN }, { someKey: NaN })).toBe(true);
      expect(isEqual({ someKey: null }, { someKey: null })).toBe(true);
      expect(isEqual({ someKey: date }, { someKey: date })).toBe(true);
      expect(isEqual({}, {})).toBe(true);
      expect(isEqual([null], [null])).toBe(true);
    });

    it("should return false when comparison throws an error", async () => {
      // Create an object with a getter that throws
      const throwingObj = {
        get evil() {
          throw new Error("Comparison error");
        },
      };

      const obj1 = { prop: throwingObj };
      const obj2 = { prop: { key: 2 } };

      // Should return false when comparison throws
      expect(isEqual(obj1, obj2)).toBe(false);
    });
  });

  describe("when getValidCacheData gets triggered", () => {
    const mockRequest = {
      staleTime: 1000,
      client: {
        cache: {
          version: 1,
        },
      },
      cacheKey: "test-key",
      cacheTime: 2000,
    } as any;

    it("should return initialResponse data when cache is stale", () => {
      const initialResponse = {
        data: "test-data",
        status: 200,
        success: true,
        requestTimestamp: new Date().getTime(),
        responseTimestamp: new Date().getTime(),
      };

      const result = getValidCacheData(mockRequest, initialResponse, null);

      expect(result).toEqual(
        expect.objectContaining({
          data: "test-data",
          error: null,
          status: 200,
          success: true,
          extra: null,
          staleTime: 1000,
          version: 1,
          cacheKey: "test-key",
          cacheTime: 2000,
        }),
      );
    });

    it("should return null when no cache data and no initialResponse", () => {
      const result = getValidCacheData(mockRequest, null, null);
      expect(result).toBeNull();
    });

    it("should return cache data when not stale", () => {
      const currentTime = new Date().getTime();
      const cacheData = {
        data: "cached-data",
        error: null,
        status: 200,
        success: true,
        extra: null,
        responseTimestamp: currentTime, // Recent timestamp within stale time
      } as any;

      const result = getValidCacheData(mockRequest, null, cacheData);
      expect(result).toBe(cacheData);
    });
  });

  describe("when getInitialState handles async responseMapper", () => {
    it("should return initialState when responseMapper returns a Promise", () => {
      const mockRequest = {
        client: {
          cache: { get: jest.fn().mockReturnValue(null) },
          defaultExtra: null,
        },
        queryKey: "test",
        cacheKey: "test",
        unsafe_responseMapper: () => Promise.resolve({ data: "test" }),
      } as any;

      const mockDispatcher = {
        getQueue: jest.fn().mockReturnValue({ stopped: false }),
        hasRunningRequests: jest.fn().mockReturnValue(false),
      } as any;

      const result = getInitialState({
        initialResponse: { data: "test" },
        dispatcher: mockDispatcher,
        request: mockRequest,
        disabled: false,
        revalidate: false,
      });

      expect(result).toEqual(initialState);
    });
  });

  describe("when getInitialState handles sync responseMapper", () => {
    it("should apply sync responseMapper to cache data", () => {
      const currentTime = new Date().getTime();
      const cacheData = {
        data: "original-data",
        error: null,
        status: 200,
        success: true,
        extra: null,
        responseTimestamp: currentTime,
        retries: 0,
      };

      const client = createClient({ url: "http://localhost:3000" });
      const mockRequest = client.createRequest()({ endpoint: "/test" });
      mockRequest.unsafe_responseMapper = (data: any) => ({
        ...data,
        data: `mapped-${data.data}`,
      });

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      client.cache = {
        get: jest.fn().mockReturnValue(cacheData),
        version: "1",
      };

      const mockDispatcher = {
        getQueue: jest.fn().mockReturnValue({ stopped: false }),
        hasRunningRequests: jest.fn().mockReturnValue(false),
      } as any;

      const result = getInitialState({
        initialResponse: null,
        dispatcher: mockDispatcher,
        request: mockRequest,
        disabled: false,
        revalidate: false,
      });

      expect(result).toEqual(
        expect.objectContaining({
          data: "mapped-original-data",
          error: null,
          status: 200,
          success: true,
          loading: false,
        }),
      );
    });
  });
});
