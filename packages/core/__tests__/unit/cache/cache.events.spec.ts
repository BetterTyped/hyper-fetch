import EventEmitter from "events";

import { getCacheEvents } from "cache";

describe("Cache [ Events ]", () => {
  const key = "test";

  const storage = new Map();
  storage.set("test", {});
  let events = getCacheEvents(new EventEmitter(), storage);
  const spy = jest.fn();

  beforeEach(() => {
    events = getCacheEvents(new EventEmitter(), storage);
    jest.resetAllMocks();
  });

  describe("when revalidate event is triggered", () => {
    it("should revalidate cache using cache key", async () => {
      events.onRevalidate(key, spy);
      events.revalidate(key);
      expect(spy).toBeCalledTimes(1);
    });
    it("should revalidate cache using regex string", async () => {
      events.onRevalidate(key, spy);
      events.revalidate(/test/);
      expect(spy).toBeCalledTimes(1);
    });
    it("should revalidate cache using regex", async () => {
      events.onRevalidate(key, spy);
      events.revalidate(/test/);
      expect(spy).toBeCalledTimes(1);
    });
  });
});
