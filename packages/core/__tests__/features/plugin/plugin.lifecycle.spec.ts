import type { Cache } from "cache";
import { Client } from "client";
import type { HttpAdapterType } from "http-adapter";
import { LoggerManager } from "managers";
import type { PluginMethods } from "plugin";
import { Plugin } from "plugin";

import { createCacheResponse, getThrownErrors, getUnhandledRejections } from "../../utils/fixtures.utils";

type Data = { id: number };

const requestHooks = [
  "onRequestTrigger",
  "onRequestStart",
  "onRequestSuccess",
  "onRequestError",
  "onRequestFinished",
  "onCacheItemChange",
] as const;

const allHooks = [
  "onMount",
  "onUnmount",
  "onRequestCreate",
  "onRequestTrigger",
  "onRequestStart",
  "onRequestSuccess",
  "onRequestError",
  "onRequestFinished",
  "onDispatcherCleared",
  "onDispatcherQueueDrained",
  "onDispatcherQueueRunning",
  "onDispatcherItemAdded",
  "onDispatcherItemDeleted",
  "onDispatcherQueueCreated",
  "onDispatcherQueueCleared",
  "onCacheItemChange",
  "onCacheItemDelete",
  "onCacheItemInvalidate",
  "onAdapterFetch",
] as const satisfies readonly (keyof PluginMethods<Client>)[];

/** Plugin which records the order of the request lifecycle hooks */
const createRecorder = (name: string, order: string[]) => {
  const plugin = new Plugin({ name });
  requestHooks.forEach((hook) => {
    plugin[hook](() => {
      order.push(`${name}:${hook}`);
    });
  });
  return plugin;
};

describe("Plugin [ Lifecycle ]", () => {
  let client = new Client({ url: "shared-base-url" });
  let request = client.createRequest<{ response: Data }>()({ endpoint: "/users" });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
    request = client.createRequest<{ response: Data }>()({ endpoint: "/users" });
    request.setMock(() => ({ data: { id: 1 }, status: 200 }));
  });

  afterEach(() => {
    client.clear();
  });

  describe("When the plugin is registered", () => {
    it("should return the plugin from every hook method", () => {
      const plugin = new Plugin({ name: "chain" });

      allHooks.forEach((hook) => {
        expect(plugin[hook](() => {})).toBe(plugin);
      });
    });

    it("should trigger the callback registered with every hook method", () => {
      const plugin = new Plugin({ name: "trigger" });
      const spies = allHooks.map((hook) => {
        const spy = vi.fn();
        plugin[hook](spy);
        return spy;
      });
      const data = { client } as never;

      allHooks.forEach((hook) => plugin.trigger(hook, data));

      spies.forEach((spy) => {
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(data);
      });
    });

    it("should use only the latest callback of the hook", () => {
      const first = vi.fn();
      const second = vi.fn();
      const plugin = new Plugin({ name: "replace" }).onRequestCreate(first).onRequestCreate(second);
      client.addPlugin(plugin);

      client.createRequest()({ endpoint: "/users" });

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledTimes(1);
    });

    it("should keep the name and the data of the plugin", () => {
      const data = { requests: 0 };
      const plugin = new Plugin({ name: "data", data });

      expect(plugin.name).toBe("data");
      expect(plugin.data).toBe(data);
      expect(plugin.client).toBeUndefined();
    });

    it("should mount the plugin with the client", () => {
      const onMount = vi.fn();
      const plugin = new Plugin({ name: "mount" }).onMount(onMount);

      client.addPlugin(plugin);

      expect(onMount).toHaveBeenCalledTimes(1);
      expect(onMount).toHaveBeenCalledWith({ client });
      expect(plugin.client).toBe(client);
      expect(client.plugins).toStrictEqual([plugin]);
    });

    it("should unmount the removed plugin", () => {
      const onUnmount = vi.fn();
      const plugin = new Plugin({ name: "unmount" }).onUnmount(onUnmount);
      client.addPlugin(plugin);

      client.removePlugin(plugin);

      expect(onUnmount).toHaveBeenCalledTimes(1);
      expect(onUnmount).toHaveBeenCalledWith({ client });
      expect(client.plugins).toHaveLength(0);
    });

    it("should not unmount the plugin which was never added", () => {
      const onUnmount = vi.fn();
      const added = new Plugin({ name: "added" });
      client.addPlugin(added);

      client.removePlugin(new Plugin({ name: "unknown" }).onUnmount(onUnmount));

      expect(onUnmount).not.toHaveBeenCalled();
      expect(client.plugins).toStrictEqual([added]);
    });

    it("should not unmount the plugin twice", () => {
      const onUnmount = vi.fn();
      const plugin = new Plugin({ name: "unmount" }).onUnmount(onUnmount);
      client.addPlugin(plugin);

      client.removePlugin(plugin);
      client.removePlugin(plugin);

      expect(onUnmount).toHaveBeenCalledTimes(1);
    });

    it("should not notify the removed plugin anymore", async () => {
      const spy = vi.fn();
      const plugin = new Plugin({ name: "removed" }).onRequestCreate(spy).onRequestStart(spy).onCacheItemChange(spy);
      client.addPlugin(plugin);
      client.removePlugin(plugin);

      client.createRequest()({ endpoint: "/other" });
      await request.send();

      expect(spy).not.toHaveBeenCalled();
    });

    it("should notify the plugin about the requests created after it was added", () => {
      const spy = vi.fn();
      client.addPlugin(new Plugin({ name: "create" }).onRequestCreate(spy));

      const created = client.createRequest()({ endpoint: "/created" });

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({ request: created });
    });
  });

  describe("When the request is sent", () => {
    it("should trigger the hooks of the successful request in order", async () => {
      const order: string[] = [];
      client.addPlugin(createRecorder("plugin", order));

      await request.send();

      expect(order).toStrictEqual([
        "plugin:onRequestTrigger",
        "plugin:onRequestStart",
        "plugin:onRequestSuccess",
        "plugin:onRequestFinished",
        "plugin:onCacheItemChange",
      ]);
    });

    it("should trigger the hooks of the failed request in order", async () => {
      const order: string[] = [];
      request.setMock(() => ({ error: new Error("Failed"), status: 400 }));
      client.addPlugin(createRecorder("plugin", order));

      await request.send();

      expect(order).toStrictEqual([
        "plugin:onRequestTrigger",
        "plugin:onRequestStart",
        "plugin:onRequestError",
        "plugin:onRequestFinished",
      ]);
    });

    it("should trigger every hook for the plugins in the order they were added", async () => {
      const order: string[] = [];
      client.addPlugin(createRecorder("first", order)).addPlugin(createRecorder("second", order));

      await request.send();

      expect(order).toStrictEqual(
        ["onRequestTrigger", "onRequestStart", "onRequestSuccess", "onRequestFinished", "onCacheItemChange"].flatMap(
          (hook) => [`first:${hook}`, `second:${hook}`],
        ),
      );
    });

    it("should pass the response modified by the interceptors to the plugins", async () => {
      const onRequestSuccess = vi.fn();
      const onRequestFinished = vi.fn();
      client.onResponse((response) => ({ ...response, data: { id: 2 } }));
      client.addPlugin(
        new Plugin({ name: "response" }).onRequestSuccess(onRequestSuccess).onRequestFinished(onRequestFinished),
      );

      const response = await request.send();

      expect(onRequestSuccess.mock.calls[0][0].response).toStrictEqual(response);
      expect(onRequestFinished.mock.calls[0][0].response.data).toStrictEqual({ id: 2 });
    });

    it("should trigger the adapter hook for every sent request", async () => {
      const onAdapterFetch = vi.fn();
      client.addPlugin(new Plugin({ name: "adapter" }).onAdapterFetch(onAdapterFetch));

      await request.send();
      await request.exec();

      expect(onAdapterFetch).toHaveBeenCalledTimes(2);
      expect(onAdapterFetch.mock.calls[0][0].adapter).toBe(client.adapter);
    });
  });

  describe("When the cache changes", () => {
    it("should trigger the delete hook", () => {
      const onCacheItemDelete = vi.fn();
      client.addPlugin(new Plugin({ name: "cache" }).onCacheItemDelete(onCacheItemDelete));
      client.cache.set(request, createCacheResponse({ id: 1 }));

      client.cache.delete(request.cacheKey);

      expect(onCacheItemDelete).toHaveBeenCalledTimes(1);
      expect(onCacheItemDelete).toHaveBeenCalledWith({ cache: client.cache, cacheKey: request.cacheKey });
    });

    it("should trigger the invalidate hook", () => {
      const onCacheItemInvalidate = vi.fn();
      client.addPlugin(new Plugin({ name: "cache" }).onCacheItemInvalidate(onCacheItemInvalidate));
      client.cache.set(request, createCacheResponse({ id: 1 }));

      client.cache.invalidate(request.cacheKey);

      expect(onCacheItemInvalidate).toHaveBeenCalledTimes(1);
      expect(onCacheItemInvalidate).toHaveBeenCalledWith({ cache: client.cache, cacheKey: request.cacheKey });
    });

    it("should trigger the invalidate hook for every invalidated element", () => {
      const onCacheItemInvalidate = vi.fn();
      client.addPlugin(new Plugin({ name: "cache" }).onCacheItemInvalidate(onCacheItemInvalidate));
      client.cache.set(request.setCacheKey("first"), createCacheResponse({ id: 1 }));
      client.cache.set(request.setCacheKey("second"), createCacheResponse({ id: 2 }));

      client.cache.invalidate();

      expect(onCacheItemInvalidate.mock.calls.map(([data]) => data.cacheKey)).toStrictEqual(["first", "second"]);
    });

    it("should trigger the invalidate hook before the listeners", () => {
      const order: string[] = [];
      client.addPlugin(new Plugin({ name: "cache" }).onCacheItemInvalidate(() => order.push("plugin")));
      client.cache.events.onInvalidate(() => order.push("listener"));

      client.cache.invalidate(request.cacheKey);

      expect(order).toStrictEqual(["plugin", "listener"]);
    });
  });

  describe("When the plugin throws", () => {
    const pluginError = new Error("Plugin failed");
    const failingPlugin = (hook: (typeof requestHooks)[number]) =>
      new Plugin({ name: "failing" })[hook](() => {
        throw pluginError;
      });

    it.each([
      "onRequestTrigger",
      "onRequestStart",
      "onRequestSuccess",
      "onRequestFinished",
      "onCacheItemChange",
    ] as const)("should finish the successful request when the %s hook throws", async (hook) => {
      client.addPlugin(failingPlugin(hook));

      let response: Awaited<ReturnType<typeof request.send>> | undefined;
      let rejections: unknown[] = [];
      const thrown = await getThrownErrors(async () => {
        rejections = await getUnhandledRejections(async () => {
          response = await request.send();
        });
      });

      expect(rejections).toHaveLength(0);
      // The error is not swallowed - it is thrown outside of the request lifecycle
      expect(thrown).toStrictEqual([pluginError]);
      expect(response?.success).toBeTrue();
      expect(response?.data).toStrictEqual({ id: 1 });
      expect(request.read()?.data).toStrictEqual({ id: 1 });
    });

    it.each(["onRequestError", "onRequestFinished"] as const)(
      "should finish the failed request when the %s hook throws",
      async (hook) => {
        request.setMock(() => ({ error: new Error("Failed"), status: 400 }));
        client.addPlugin(failingPlugin(hook));

        let response: Awaited<ReturnType<typeof request.send>> | undefined;
        let rejections: unknown[] = [];
        const thrown = await getThrownErrors(async () => {
          rejections = await getUnhandledRejections(async () => {
            response = await request.send();
          });
        });

        expect(rejections).toHaveLength(0);
        expect(thrown).toStrictEqual([pluginError]);
        expect(response?.success).toBeFalse();
        expect(response?.error?.message).toBe("Failed");
      },
    );

    it("should notify the next plugins", async () => {
      const order: string[] = [];
      client.addPlugin(failingPlugin("onRequestSuccess")).addPlugin(createRecorder("next", order));

      const thrown = await getThrownErrors(() => request.send());

      expect(thrown).toStrictEqual([pluginError]);
      expect(order).toContain("next:onRequestSuccess");
      expect(order).toContain("next:onCacheItemChange");
    });

    it("should store and emit the cache data when the cache hook throws", async () => {
      const spy = vi.fn();
      client.addPlugin(failingPlugin("onCacheItemChange"));
      client.cache.events.onDataByKey(request.cacheKey, spy);

      const thrown = await getThrownErrors(() => {
        expect(() => client.cache.set(request, createCacheResponse({ id: 1 }))).not.toThrow();
      });

      expect(thrown).toStrictEqual([pluginError]);

      expect(request.read()?.data).toStrictEqual({ id: 1 });
      expect(spy).toHaveBeenCalledTimes(1);
      expect(client.cache.garbageCollectors.size).toBe(1);
    });

    it("should delete and invalidate the cache data when the cache hooks throw", async () => {
      const deleteSpy = vi.fn();
      const invalidateSpy = vi.fn();
      client.addPlugin(
        new Plugin({ name: "failing" })
          .onCacheItemDelete(() => {
            throw new Error("Plugin failed");
          })
          .onCacheItemInvalidate(() => {
            throw new Error("Plugin failed");
          }),
      );
      client.cache.set(request, createCacheResponse({ id: 1 }));
      client.cache.events.onDelete(deleteSpy);
      client.cache.events.onInvalidate(invalidateSpy);

      const thrown = await getThrownErrors(() => {
        client.cache.invalidate(request.cacheKey);
        client.cache.delete(request.cacheKey);
      });

      expect(thrown).toHaveLength(2);
      expect(invalidateSpy).toHaveBeenCalledTimes(1);
      expect(deleteSpy).toHaveBeenCalledTimes(1);
      expect(request.read()).toBeUndefined();
    });

    it("should log the failure with the name of the plugin and the hook", async () => {
      const logger = vi.fn();
      client.setDebug(true).setLogger(() => new LoggerManager({ logger }));
      client.addPlugin(failingPlugin("onCacheItemChange"));

      await getThrownErrors(() => {
        client.cache.set(request, createCacheResponse({ id: 1 }));
      });

      expect(logger).toHaveBeenCalledTimes(1);
      expect(logger.mock.calls[0][0]).toStrictEqual(
        expect.objectContaining({
          level: "error",
          module: "Client",
          title: 'Plugin "failing" failed',
          extra: { plugin: "failing", method: "onCacheItemChange", error: new Error("Plugin failed") },
        }),
      );
    });
  });

  describe("When the types are checked", () => {
    it("should type the data passed to the hooks", () => {
      const plugin = new Plugin<Client>({ name: "types" });

      plugin.onMount((data) => {
        expectTypeOf(data.client).toEqualTypeOf<Client>();
      });
      plugin.onCacheItemDelete((data) => {
        expectTypeOf(data.cacheKey).toBeString();
        expectTypeOf(data.cache).toEqualTypeOf<Cache<HttpAdapterType>>();
      });
      plugin.onCacheItemInvalidate((data) => {
        expectTypeOf(data).toEqualTypeOf<{ cacheKey: string; cache: Cache<HttpAdapterType> }>();
      });
      plugin.onRequestSuccess((data) => {
        expectTypeOf(data.response.success).toEqualTypeOf<true>();
      });
      plugin.onRequestError((data) => {
        expectTypeOf(data.response.success).toEqualTypeOf<false>();
      });
      expectTypeOf(plugin.onRequestStart(() => {})).toEqualTypeOf(plugin);
    });

    it("should type the data of the plugin", () => {
      const plugin = new Plugin<Client, { requests: number }>({ name: "data", data: { requests: 0 } });

      expectTypeOf(plugin.data).toEqualTypeOf<{ requests: number }>();
      expectTypeOf(plugin.name).toBeString();
    });
  });
});
