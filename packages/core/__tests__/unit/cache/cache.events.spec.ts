import { getCacheEvents } from "cache";
import EventEmitter from "events";

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
      await events.revalidate(key);
      expect(spy).toBeCalledTimes(1);
    });
    it("should revalidate cache using regex string", async () => {
      events.onRevalidate(key, spy);
      await events.revalidate(/test/);
      expect(spy).toBeCalledTimes(1);
    });
    it("should revalidate cache using regex", async () => {
      events.onRevalidate(key, spy);
      await events.revalidate(/test/);
      expect(spy).toBeCalledTimes(1);
    });
  });
});

// revalidate: async (pattern: CacheKeyType | RegExp): Promise<void> => {
//   const keys = await storage.keys();

//   if (typeof pattern === "string" && pattern.startsWith("/") && pattern.endsWith("/")) {
//     const [matcher] = matchPath(pattern);
//     emitter.emit(getRevalidateEventKey(pattern));

//     // eslint-disable-next-line no-restricted-syntax
//     for (const entityKey of keys) {
//       if (matcher.test(entityKey)) {
//         emitter.emit(getRevalidateEventKey(entityKey));
//       }
//     }
//   } else if (typeof pattern === "string") {
//     emitter.emit(getRevalidateEventKey(pattern));
//   } else {
//     // eslint-disable-next-line no-restricted-syntax
//     for (const entityKey of keys) {
//       if (pattern.test(entityKey)) {
//         emitter.emit(getRevalidateEventKey(entityKey));
//       }
//     }
//   }
// },
