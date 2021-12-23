import { ClientResponseSuccessType } from "client";
import { Cache, getCacheKey, CACHE_EVENTS, cacheEventEmitter } from "cache";

import { getManyRequest, getManyMock, GetManyResponseType } from "../../utils/mocks/get-many.mock";
import { testBuilder } from "../../utils/server/server.constants";

const endpointKey = getCacheKey(getManyRequest);
const requestKey = "custom-key";
const response = {
  endpointKey,
  requestKey,
  response: [getManyMock().fixture, null, 0] as ClientResponseSuccessType<GetManyResponseType>,
  retries: 0,
  isRefreshed: false,
  timestamp: +new Date(),
};

let cacheInstance = new Cache();

describe("Cache", () => {
  beforeEach(async () => {
    cacheEventEmitter.removeAllListeners();
    testBuilder.clear();
    cacheInstance = new Cache();
  });

  describe("When lifecycle events get triggered", () => {
    it("should initialize cache", async () => {
      expect(cacheInstance.get(endpointKey, requestKey)).not.toBeDefined();

      cacheInstance.set(response);

      expect(cacheInstance.get(endpointKey, requestKey)).toBeDefined();
    });

    it("should delete cache and send signal", async () => {
      const trigger = jest.fn();

      CACHE_EVENTS.onRevalidate(requestKey, () => {
        trigger();
      });

      cacheInstance.set(response);
      expect(cacheInstance.get(endpointKey, requestKey)).toBeDefined();

      cacheInstance.deleteResponse(endpointKey, requestKey);

      expect(trigger).toBeCalled();
      expect(cacheInstance.get(endpointKey, requestKey)).not.toBeDefined();
    });
  });

  describe("When using deep compare", () => {
    it("should not overwrite the same data", async () => {
      const trigger = jest.fn();

      CACHE_EVENTS.get(requestKey, () => {
        trigger();
      });

      cacheInstance.set(response);
      cacheInstance.set(response);
      cacheInstance.set(response);

      expect(trigger).toBeCalledTimes(1);
      expect(cacheInstance.get(endpointKey, requestKey)).toBeDefined();
    });

    it("should write data when cache is empty or gets deleted", async () => {
      const trigger = jest.fn();

      CACHE_EVENTS.get(requestKey, () => {
        trigger();
      });

      cacheInstance.set(response);
      cacheInstance.deleteResponse(endpointKey, requestKey);
      expect(cacheInstance.get(endpointKey, requestKey)).not.toBeDefined();
      cacheInstance.set(response);
      cacheInstance.deleteResponse(endpointKey, requestKey);
      expect(cacheInstance.get(endpointKey, requestKey)).not.toBeDefined();
      cacheInstance.set(response);

      expect(trigger).toBeCalledTimes(3);
      expect(cacheInstance.get(endpointKey, requestKey)).toBeDefined();
    });

    it("should allow to use own deep compare function when saving data", async () => {
      const deepCompare = jest.fn();

      cacheInstance.set({ ...response, deepCompareFn: deepCompare });

      expect(deepCompare).toBeCalledTimes(1);
      expect(cacheInstance.get(endpointKey, requestKey)).toBeDefined();
    });

    it("should allow to disable deep comparison when saving data", async () => {
      cacheInstance.set({ ...response, deepCompareFn: null });

      expect(cacheInstance.get(endpointKey, requestKey)).toBeDefined();
    });
  });

  describe("When CacheStore gets cleared before triggering cache actions", () => {
    it("should return undefined when removed cache entity", async () => {
      const trigger = jest.fn();

      CACHE_EVENTS.onRevalidate(requestKey, () => {
        trigger();
      });

      cacheInstance.clear();

      expect(trigger).toBeCalledTimes(0);
      expect(cacheInstance.get(endpointKey, requestKey)).not.toBeDefined();
    });
  });
});
