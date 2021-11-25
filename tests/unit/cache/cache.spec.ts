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

describe("Basic Cache usage", () => {
  beforeEach(async () => {
    cacheEventEmitter.removeAllListeners();
    CacheStore.clear();
    cacheInstance = new Cache(getManyRequest, requestKey);
  });

  it("should initialize cache", async () => {
    expect(CacheStore.get(requestKey)).toBeDefined();
    expect(cacheInstance.get(endpointKey)).not.toBeDefined();

    cacheInstance.set(response);
    expect(cacheInstance.get(requestKey)).toBeDefined();
  });

  it("should delete cache and send signal", async () => {
    let triggered = false;

    cacheInstance.set(response);
    expect(cacheInstance.get(requestKey)).toBeDefined();

    CACHE_EVENTS.onRevalidate(requestKey, () => {
      triggered = true;
    });

    cacheInstance.delete();

    expect(triggered).toBe(true);
    expect(cacheInstance.get(requestKey)).not.toBeDefined();
  });
});
