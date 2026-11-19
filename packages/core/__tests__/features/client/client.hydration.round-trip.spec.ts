import type { ResponseType } from "adapter";
import { Client } from "client";
import type { HttpAdapterType } from "http-adapter";
import { xhrExtra } from "http-adapter";
import { scopeKey } from "request";
import type { HydrateDataType } from "types";

import { createCacheResponse } from "../../utils/fixtures.utils";

const createResponse = <Data>(
  data: Data,
  overrides: Partial<ResponseType<Data, Error, HttpAdapterType>> = {},
): ResponseType<Data, Error, HttpAdapterType> => ({
  data,
  error: null,
  status: 200,
  success: true,
  extra: xhrExtra,
  requestTimestamp: Date.now(),
  responseTimestamp: Date.now(),
  ...overrides,
});

/** The way the dehydrated data travels from the server to the browser */
const serialize = <T>(value: T): T => {
  const json = JSON.stringify(value);
  return JSON.parse(json);
};

describe("Client [ Hydration Round Trip ]", () => {
  let server = new Client({ url: "shared-base-url", mode: "client" });
  let browser = new Client({ url: "shared-base-url", mode: "client" });
  let serverRequest = server.createRequest<{ response: any }>()({ endpoint: "/users" });
  let browserRequest = browser.createRequest<{ response: any }>()({ endpoint: "/users" });

  beforeEach(() => {
    server = new Client({ url: "shared-base-url", mode: "client" });
    browser = new Client({ url: "shared-base-url", mode: "client" });
    serverRequest = server.createRequest<{ response: any }>()({ endpoint: "/users" });
    browserRequest = browser.createRequest<{ response: any }>()({ endpoint: "/users" });
  });

  afterEach(() => {
    server.clear();
    browser.clear();
  });

  describe("When the data travels between the clients", () => {
    it("should read the same response after the round trip", () => {
      const response = createResponse({ users: [{ id: 1, name: "Kate" }], total: 1 });

      browser.hydrate([serialize(serverRequest.dehydrate({ response }))]);

      expect(browserRequest.read()).toStrictEqual(response);
    });

    it("should dehydrate the response stored in the cache", () => {
      const response = createCacheResponse({ id: 1 });
      server.cache.set(serverRequest, response);

      browser.hydrate([serialize(serverRequest.dehydrate())]);

      expect(browserRequest.read()).toStrictEqual(serverRequest.read());
    });

    it.each([
      { name: "zero", value: 0 },
      { name: "false", value: false },
      { name: "empty string", value: "" },
      { name: "empty array", value: [] },
    ])("should keep the falsy data - $name", ({ value }) => {
      browser.hydrate([serialize(serverRequest.dehydrate({ response: createResponse(value) }))]);

      expect(browserRequest.read()?.data).toStrictEqual(value);
    });

    it("should hydrate many requests at once", () => {
      const first = serverRequest.setCacheKey("first");
      const second = serverRequest.setCacheKey("second");

      browser.hydrate(
        serialize([
          first.dehydrate({ response: createResponse("first") }),
          second.dehydrate({ response: createResponse("second") }),
        ]),
      );

      expect(browser.cache.keys()).toStrictEqual(["first", "second"]);
      expect(browser.cache.get("second")?.data).toBe("second");
    });

    it("should keep the stale time and the cache time of the request", () => {
      const configured = serverRequest.setStaleTime(1234).setCacheTime(5678);

      browser.hydrate([serialize(configured.dehydrate({ response: createResponse({ id: 1 }) }))]);

      expect(browser.cache.get(browserRequest.cacheKey)).toStrictEqual(
        expect.objectContaining({ staleTime: 1234, cacheTime: 5678, cacheKey: browserRequest.cacheKey, cached: true }),
      );
    });

    it("should never collect the response hydrated with the infinite cache time", () => {
      const configured = serverRequest.setCacheTime(Infinity);

      browser.hydrate([serialize(configured.dehydrate({ response: createResponse({ id: 1 }) }))]);

      expect(browser.cache.get(browserRequest.cacheKey)?.cacheTime).toBeNull();
      expect(browser.cache.garbageCollectors.size).toBe(0);
      expect(browserRequest.read()?.data).toStrictEqual({ id: 1 });
    });

    it("should turn the dates into strings when the data is serialized", () => {
      const createdAt = new Date("2026-01-01T00:00:00.000Z");
      const dehydrated = serverRequest.dehydrate({ response: createResponse({ createdAt, missing: undefined }) });

      browser.hydrate([serialize(dehydrated)]);

      expect(browserRequest.read()?.data).toStrictEqual({ createdAt: createdAt.toISOString() });
    });

    it("should keep the values as they are when the data is not serialized", () => {
      const createdAt = new Date("2026-01-01T00:00:00.000Z");

      browser.hydrate([serverRequest.dehydrate({ response: createResponse({ createdAt }) })]);

      expect(browserRequest.read()?.data.createdAt).toBe(createdAt);
    });
  });

  describe("When the response is hydrated", () => {
    it("should mark the cached element as hydrated", () => {
      browser.hydrate([serialize(serverRequest.dehydrate({ response: createResponse({ id: 1 }) }))]);

      expect(browser.cache.get(browserRequest.cacheKey)?.hydrated).toBeTrue();
    });

    it("should not mark the elements set by the requests as hydrated", () => {
      browser.cache.set(browserRequest, createCacheResponse({ id: 1 }));

      expect(browser.cache.get(browserRequest.cacheKey)?.hydrated).toBeUndefined();
    });

    it("should fill the request details of the hydrated element", () => {
      const response = createResponse({ id: 1 }, { requestTimestamp: Date.now() - 50 });

      browser.hydrate([serialize(serverRequest.dehydrate({ response }))]);

      expect(browser.cache.get(browserRequest.cacheKey)).toStrictEqual(
        expect.objectContaining({
          retries: 0,
          isCanceled: false,
          isOffline: false,
          willRetry: false,
          addedTimestamp: response.requestTimestamp,
          triggerTimestamp: response.requestTimestamp,
          requestTimestamp: response.requestTimestamp,
          responseTimestamp: response.responseTimestamp,
        }),
      );
    });

    it("should notify the cache listeners", () => {
      const spy = vi.fn();
      browser.cache.events.onDataByKey(browserRequest.cacheKey, spy);

      browser.hydrate([serialize(serverRequest.dehydrate({ response: createResponse({ id: 1 }) }))]);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].data).toStrictEqual({ id: 1 });
    });

    it("should keep the data reference when the same response is hydrated again", () => {
      const dehydrated = serverRequest.dehydrate({ response: createResponse({ users: [{ id: 1 }] }) });
      browser.hydrate([serialize(dehydrated)]);
      const first = browserRequest.read()?.data;

      browser.hydrate([serialize(dehydrated)]);

      expect(browserRequest.read()?.data).toBe(first);
    });

    it("should not store the failed response", () => {
      const response = createResponse(null, { success: false, status: 500, error: new Error("Failed") });

      browser.hydrate([serialize(serverRequest.dehydrate({ response }))]);

      expect(browserRequest.read()).toBeUndefined();
    });

    it("should remove the response older than its cache time", () => {
      const configured = serverRequest.setCacheTime(1000);
      const response = createResponse({ id: 1 }, { responseTimestamp: Date.now() - 5000 });

      browser.hydrate([serialize(configured.dehydrate({ response }))]);

      expect(browserRequest.read()).toBeUndefined();
    });

    it("should skip the empty items", () => {
      const dehydrated = serverRequest.dehydrate({ response: createResponse({ id: 1 }) });

      expect(() =>
        browser.hydrate([null, undefined, serverRequest.setCacheKey("missing").dehydrate(), dehydrated]),
      ).not.toThrow();
      expect(browser.cache.keys()).toStrictEqual([browserRequest.cacheKey]);
    });

    it("should accept the empty list", () => {
      expect(() => browser.hydrate([])).not.toThrow();
      expect(browser.cache.keys()).toHaveLength(0);
    });
  });

  describe("When the cache already holds the data", () => {
    const hydrateWith = (options: Partial<HydrateDataType>, data = "hydrated") => {
      const dehydrated = serverRequest.dehydrate({ response: createResponse(data) }) as HydrateDataType;
      browser.hydrate([serialize({ ...dehydrated, ...options })]);
    };

    it("should override the cached data by default", () => {
      browser.cache.set(browserRequest, createCacheResponse("cached"));

      hydrateWith({});

      expect(browserRequest.read()?.data).toBe("hydrated");
    });

    it("should keep the cached data when the override is disabled", () => {
      browser.cache.set(browserRequest, createCacheResponse("cached"));

      hydrateWith({ override: false });

      expect(browserRequest.read()?.data).toBe("cached");
    });

    it("should fill the missing data when the override is disabled", () => {
      hydrateWith({ override: false });

      expect(browserRequest.read()?.data).toBe("hydrated");
    });

    it("should respect the override option passed to dehydrate", () => {
      browser.cache.set(browserRequest, createCacheResponse("cached"));

      browser.hydrate([serialize(serverRequest.dehydrate({ response: createResponse("hydrated"), override: false }))]);

      expect(browserRequest.read()?.data).toBe("cached");
    });

    it("should prefer the options passed to hydrate over the options of the item", () => {
      const dehydrated = serverRequest.dehydrate({ response: createResponse("hydrated"), override: true });
      browser.cache.set(browserRequest, createCacheResponse("cached"));

      browser.hydrate([serialize(dehydrated)], { override: false });

      expect(browserRequest.read()?.data).toBe("cached");
    });

    it("should resolve the options for each item with the function", () => {
      const first = serverRequest.setCacheKey("first");
      const second = serverRequest.setCacheKey("second");
      const options = vi.fn((item: HydrateDataType) => ({ override: item.cacheKey === "second" }));
      browser.cache.set(browserRequest.setCacheKey("first"), createCacheResponse("cached"));
      browser.cache.set(browserRequest.setCacheKey("second"), createCacheResponse("cached"));

      browser.hydrate(
        serialize([
          first.dehydrate({ response: createResponse("hydrated") }),
          second.dehydrate({ response: createResponse("hydrated") }),
        ]),
        options,
      );

      expect(options).toHaveBeenCalledTimes(2);
      expect(browser.cache.get("first")?.data).toBe("cached");
      expect(browser.cache.get("second")?.data).toBe("hydrated");
    });
  });

  describe("When the requests are scoped", () => {
    it("should hydrate the response under its scope", () => {
      const scoped = serverRequest.setScope("user-1");

      browser.hydrate([serialize(scoped.dehydrate({ response: createResponse("scoped") }))]);

      expect(browser.cache.keys()).toStrictEqual([scopeKey(browserRequest.cacheKey, "user-1")]);
      expect(browserRequest.setScope("user-1").read()?.data).toBe("scoped");
      expect(browserRequest.read()).toBeUndefined();
      expect(browserRequest.setScope("user-2").read()).toBeUndefined();
    });

    it("should dehydrate the cached response of the scope", () => {
      const scoped = serverRequest.setScope("user-1");
      server.cache.set(scoped, createCacheResponse("scoped"));

      expect(serverRequest.dehydrate()).toBeUndefined();
      expect(scoped.dehydrate()).toStrictEqual(
        expect.objectContaining({ scope: "user-1", cacheKey: serverRequest.cacheKey, hydrated: true }),
      );
    });

    it("should not cache the response without the scope in the server mode", () => {
      const ssrClient = new Client({ url: "shared-base-url", mode: "server" });
      const ssrRequest = ssrClient.createRequest<{ response: any }>()({ endpoint: "/users" });

      ssrClient.hydrate([serialize(serverRequest.dehydrate({ response: createResponse("value") }))]);

      expect(ssrRequest.read()).toBeUndefined();
      expect(ssrClient.cache.keys()).toHaveLength(0);
    });

    it("should cache the scoped response in the server mode", () => {
      const ssrClient = new Client({ url: "shared-base-url", mode: "server" });
      const ssrRequest = ssrClient.createRequest<{ response: any }>()({ endpoint: "/users" }).setScope("session");

      ssrClient.hydrate([
        serialize(serverRequest.setScope("session").dehydrate({ response: createResponse("value") })),
      ]);

      expect(ssrRequest.read()?.data).toBe("value");
      ssrClient.clear();
    });
  });
});
