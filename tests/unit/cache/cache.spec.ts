import { ClientResponseSuccessType } from "client";
import { CacheStore, Cache, getCacheInstanceKey, CACHE_EVENTS, cacheEventEmitter } from "cache";

import { getManyRequest, getManyMock, GetManyResponseType } from "../../utils/mocks/get-many.mock";

const endpointKey = getCacheInstanceKey(getManyRequest);
const requestKey = "custom-key";
const response = {
  key: requestKey,
  response: [getManyMock().fixture, null, 0] as ClientResponseSuccessType<GetManyResponseType>,
  retries: 0,
  isRefreshed: false,
  timestamp: new Date(),
};

let cacheInstance = new Cache(getManyRequest, requestKey);

describe("Cache", () => {
  beforeEach(async () => {
    cacheEventEmitter.removeAllListeners();
    CacheStore.clear();
    cacheInstance = new Cache(getManyRequest, requestKey);
  });

  describe("When lifecycle events get triggered", () => {
    it("should initialize cache", async () => {
      expect(CacheStore.get(requestKey)).toBeDefined();
      expect(cacheInstance.get(endpointKey)).not.toBeDefined();

      cacheInstance.set(response);
      expect(cacheInstance.get(requestKey)).toBeDefined();
    });

    it("should delete cache and send signal", async () => {
      const trigger = jest.fn();

      CACHE_EVENTS.onRevalidate(requestKey, () => {
        trigger();
      });

      cacheInstance.set(response);
      expect(cacheInstance.get(requestKey)).toBeDefined();

      cacheInstance.delete();

      expect(trigger).toBeCalled();
      expect(cacheInstance.get(requestKey)).not.toBeDefined();
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
      expect(cacheInstance.get(requestKey)).toBeDefined();
    });

    it("should write data when cache is empty or gets deleted", async () => {
      const trigger = jest.fn();

      CACHE_EVENTS.get(requestKey, () => {
        trigger();
      });

      cacheInstance.set(response);
      cacheInstance.delete();
      expect(cacheInstance.get(requestKey)).not.toBeDefined();
      cacheInstance.set(response);
      cacheInstance.delete();
      expect(cacheInstance.get(requestKey)).not.toBeDefined();
      cacheInstance.set(response);

      expect(trigger).toBeCalledTimes(3);
      expect(cacheInstance.get(requestKey)).toBeDefined();
    });

    it("should allow to use own deep compare function when saving data", async () => {
      const deepCompare = jest.fn();

      cacheInstance.set({ ...response, deepCompareFn: deepCompare });

      expect(deepCompare).toBeCalledTimes(1);
      expect(cacheInstance.get(requestKey)).toBeDefined();
    });

    it("should allow to disable deep comparison when saving data", async () => {
      cacheInstance.set({ ...response, deepCompareFn: null });

      expect(cacheInstance.get(requestKey)).toBeDefined();
    });
  });

  describe("When CacheStore gets cleared before triggering cache actions", () => {
    it("should not save data when cache store gets cleared", async () => {
      const trigger = jest.fn();

      CACHE_EVENTS.get(requestKey, () => {
        trigger();
      });

      CacheStore.clear();
      cacheInstance.set(response);

      expect(trigger).toBeCalledTimes(0);
      expect(cacheInstance.get(requestKey)).not.toBeDefined();
    });

    it("should not remove already removed cache entity", async () => {
      const trigger = jest.fn();

      CACHE_EVENTS.onRevalidate(requestKey, () => {
        trigger();
      });

      CacheStore.clear();
      cacheInstance.delete();

      expect(trigger).toBeCalledTimes(0);
      expect(cacheInstance.get(requestKey)).not.toBeDefined();
    });
  });
});
