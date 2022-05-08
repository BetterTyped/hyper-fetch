import { ClientResponseSuccessType } from "client";
import { Cache } from "cache";
import { getCommandKey } from "command";
import { CommandResponseDetails } from "managers";

import { getManyRequest, getManyMock, GetManyResponseType } from "../../utils/mocks/get-many.mock";
import { testBuilder } from "../../utils/server/server.constants";

const cacheKey = getCommandKey(getManyRequest);
const response = [getManyMock().fixture, null, 0] as ClientResponseSuccessType<GetManyResponseType>;
const details: CommandResponseDetails = {
  retries: 0,
  timestamp: new Date(),
  isFailed: false,
  isCanceled: false,
  isRefreshed: false,
  isOffline: false,
  isStopped: false,
};

let cacheInstance = new Cache(testBuilder);

describe("Cache", () => {
  beforeEach(async () => {
    testBuilder.clear();
    cacheInstance = new Cache(testBuilder);
  });

  describe("When lifecycle events get triggered", () => {
    it("should initialize cache", async () => {
      expect(await cacheInstance.get(cacheKey)).not.toBeDefined();

      await cacheInstance.set(cacheKey, response, details, true);

      expect(await cacheInstance.get(cacheKey)).toBeDefined();
    });

    it("should delete cache and send signal", async () => {
      const trigger = jest.fn();

      cacheInstance.events.onRevalidate(cacheKey, () => {
        trigger();
      });

      await cacheInstance.set(cacheKey, response, details, true);
      expect(await cacheInstance.get(cacheKey)).toBeDefined();

      await cacheInstance.delete(cacheKey);

      expect(trigger).toBeCalled();
      expect(await cacheInstance.get(cacheKey)).not.toBeDefined();
    });
  });

  describe("When CacheStore gets cleared before triggering cache actions", () => {
    it("should return undefined when removed cache entity", async () => {
      const trigger = jest.fn();

      cacheInstance.events.onRevalidate(cacheKey, () => {
        trigger();
      });

      await cacheInstance.clear();

      expect(trigger).toBeCalledTimes(0);
      expect(await cacheInstance.get(cacheKey)).not.toBeDefined();
    });
  });
});
