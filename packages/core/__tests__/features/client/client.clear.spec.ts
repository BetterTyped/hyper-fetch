import { getErrorMessage } from "adapter";
import { Client } from "client";
import { AppManager } from "managers";
import { Plugin } from "plugin";
import type { RequestInstance } from "request";

import { createCacheResponse, createDeferred } from "../../utils/fixtures.utils";

type Data = { id: number };

/**
 * Request with the mock which starts and then waits for the gate - the request stays in progress as long as we need.
 */
const createPendingRequest = (client: Client, options: { endpoint?: string; method?: "GET" | "POST" } = {}) => {
  const started = createDeferred();
  const gate = createDeferred();
  const request = client.createRequest<{ response: Data }>()({ endpoint: "/users", ...options });

  request.setMock(async () => {
    started.resolve();
    await gate.promise;
    return { data: { id: 1 }, status: 200 };
  });

  return { request, started, gate };
};

const countListeners = (emitter: { eventNames: () => (string | symbol)[]; listenerCount: (name: string) => number }) =>
  emitter.eventNames().reduce((sum, name) => sum + emitter.listenerCount(String(name)), 0);

describe("Client [ Clear ]", () => {
  let client = new Client({ url: "shared-base-url" });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url" });
  });

  afterEach(() => {
    client.clear();
  });

  describe("When requests are in progress", () => {
    it("should resolve the pending request instead of leaving it forever", async () => {
      const { request, started, gate } = createPendingRequest(client);
      const pending = request.send();
      await started.promise;

      client.clear();
      const response = await pending;
      gate.resolve();

      expect(response.success).toBeFalse();
      expect(response.data).toBeNull();
      expect(response.error?.message).toBe(getErrorMessage("deleted").message);
    });

    it("should abort the request which is in progress", async () => {
      const { request, started, gate } = createPendingRequest(client);
      const pending = request.send();
      await started.promise;
      const controllers = [...client.requestManager.abortControllers.values()].flatMap((group) => [...group.values()]);

      client.clear();
      await pending;
      gate.resolve();

      expect(controllers).toHaveLength(1);
      expect(controllers[0].signal.aborted).toBeTrue();
    });

    it("should resolve the requests waiting in the queue", async () => {
      const { request, started, gate } = createPendingRequest(client);
      const queued = request.setQueued(true);
      const pending = [queued.send(), queued.send(), queued.send()];
      await started.promise;

      client.clear();
      const responses = await Promise.all(pending);
      gate.resolve();

      expect(responses.map((response) => response.success)).toStrictEqual([false, false, false]);
    });

    it("should resolve the deduplicated requests", async () => {
      const { request, started, gate } = createPendingRequest(client);
      const pending = [request.send(), request.send()];
      await started.promise;

      client.clear();
      const responses = await Promise.all(pending);
      gate.resolve();

      expect(responses.map((response) => response.success)).toStrictEqual([false, false]);
    });

    it("should resolve the pending requests of the submit dispatcher", async () => {
      const { request, started, gate } = createPendingRequest(client, { method: "POST" });
      const pending = request.send();
      await started.promise;
      expect(client.submitDispatcher.getAllRunningRequests()).toHaveLength(1);

      client.clear();
      const response = await pending;
      gate.resolve();

      expect(response.success).toBeFalse();
    });

    it("should call the removal callback of the pending request", async () => {
      const { request, started, gate } = createPendingRequest(client);
      const onRemove = vi.fn();
      const onResponse = vi.fn();
      const pending = request.send({ onRemove, onResponse });
      await started.promise;

      client.clear();
      await pending;
      gate.resolve();

      expect(onRemove).toHaveBeenCalledTimes(1);
      expect(onResponse).not.toHaveBeenCalled();
    });

    it("should not save the response of the removed request in the new cache", async () => {
      const { request, started, gate } = createPendingRequest(client);
      const pending = request.send();
      await started.promise;

      client.clear();
      gate.resolve();
      await pending;
      const { request: nextRequest, gate: nextGate } = createPendingRequest(client, { endpoint: "/next" });
      nextGate.resolve();
      await nextRequest.send();

      expect(request.read()).toBeUndefined();
      expect(client.cache.keys()).toStrictEqual([nextRequest.cacheKey]);
    });

    it("should leave no running requests nor queues behind", async () => {
      const { request, started, gate } = createPendingRequest(client);
      const previousDispatcher = client.fetchDispatcher;
      const pending = request.send();
      await started.promise;

      client.clear();
      await pending;
      gate.resolve();

      expect(previousDispatcher.getAllRunningRequests()).toHaveLength(0);
      expect(previousDispatcher.getQueuesKeys()).toHaveLength(0);
      expect(client.fetchDispatcher.getAllRunningRequests()).toHaveLength(0);
      expect(client.requestManager.abortControllers.size).toBe(0);
    });
  });

  describe("When listeners are attached", () => {
    it("should remove the listeners of the previous modules", () => {
      const previous = {
        cache: client.cache,
        fetchDispatcher: client.fetchDispatcher,
        submitDispatcher: client.submitDispatcher,
        appManager: client.appManager,
      };
      client.cache.events.onData(() => {});
      client.cache.events.onDelete(() => {});
      client.requestManager.events.onResponse(() => {});
      client.appManager.events.onFocus(() => {});
      client.appManager.events.onOnline(() => {});

      client.clear();

      expect(countListeners(previous.cache.emitter)).toBe(0);
      expect(countListeners(previous.fetchDispatcher.emitter)).toBe(0);
      expect(countListeners(previous.submitDispatcher.emitter)).toBe(0);
      expect(countListeners(previous.appManager.emitter)).toBe(0);
      expect(client.requestManager.emitter.listenerCount("response")).toBe(0);
    });

    it("should not notify the listeners of the previous cache", () => {
      const spy = vi.fn();
      const request = client.createRequest<{ response: Data }>()({ endpoint: "/users" });
      client.cache.events.onData(spy);

      client.clear();
      client.cache.set(request, createCacheResponse({ id: 1 }));

      expect(spy).not.toHaveBeenCalled();
    });

    it("should stop reacting to the browser events with the previous app manager", () => {
      const previousAppManager = client.appManager;
      const spy = vi.fn();
      previousAppManager.events.onBlur(spy);

      client.clear();
      window.dispatchEvent(new Event("blur"));
      window.dispatchEvent(new Event("focus"));

      expect(spy).not.toHaveBeenCalled();
      expect(previousAppManager.isFocused).toBeTrue();
    });

    it("should not pile up the listeners on the app manager shared between the clears", () => {
      const appManager = new AppManager();
      const sharedClient = new Client({ url: "shared-base-url", appManager: () => appManager });
      const initialListeners = appManager.emitter.listenerCount("online");

      sharedClient.clear();
      sharedClient.clear();
      sharedClient.clear();

      expect(appManager.emitter.listenerCount("online")).toBe(initialListeners);
    });

    it("should keep the modules listening to the shared app manager after the clear", () => {
      vi.useFakeTimers();
      const appManager = new AppManager();
      const sharedClient = new Client({ url: "shared-base-url", appManager: () => appManager });
      const request = sharedClient.createRequest<{ response: Data }>()({ endpoint: "/users", cacheTime: 100 });
      sharedClient.clear();
      sharedClient.cache.set(request, createCacheResponse({ id: 1 }));
      appManager.setOnline(false);
      vi.advanceTimersByTime(1000);
      expect(request.read()).toBeDefined();

      appManager.setOnline(true);

      expect(request.read()).toBeUndefined();
      sharedClient.clear();
      vi.useRealTimers();
    });
  });

  describe("When the client keeps its configuration", () => {
    it("should empty the cache and create the new modules", () => {
      const request = client.createRequest<{ response: Data }>()({ endpoint: "/users" });
      const previous = {
        cache: client.cache,
        fetchDispatcher: client.fetchDispatcher,
        submitDispatcher: client.submitDispatcher,
        appManager: client.appManager,
      };
      client.cache.set(request, createCacheResponse({ id: 1 }));

      client.clear();

      expect(request.read()).toBeUndefined();
      expect(previous.cache.keys()).toHaveLength(0);
      expect(client.cache).not.toBe(previous.cache);
      expect(client.fetchDispatcher).not.toBe(previous.fetchDispatcher);
      expect(client.submitDispatcher).not.toBe(previous.submitDispatcher);
      expect(client.appManager).not.toBe(previous.appManager);
    });

    it("should keep the plugins without unmounting them", () => {
      const onUnmount = vi.fn();
      const onRequestCreate = vi.fn();
      const plugin = new Plugin({ name: "kept" }).onUnmount(onUnmount).onRequestCreate(onRequestCreate);
      client.addPlugin(plugin);

      client.clear();
      client.createRequest()({ endpoint: "/users" });

      expect(client.plugins).toStrictEqual([plugin]);
      expect(onUnmount).not.toHaveBeenCalled();
      expect(onRequestCreate).toHaveBeenCalledTimes(1);
    });

    it("should trigger the plugins with the new cache", () => {
      const onCacheItemChange = vi.fn();
      const request = client.createRequest<{ response: Data }>()({ endpoint: "/users" });
      client.addPlugin(new Plugin({ name: "cache" }).onCacheItemChange(onCacheItemChange));

      client.clear();
      client.cache.set(request, createCacheResponse({ id: 1 }));

      expect(onCacheItemChange).toHaveBeenCalledTimes(1);
      expect(onCacheItemChange.mock.calls[0][0].cache).toBe(client.cache);
    });

    it("should keep the interceptors and the settings", () => {
      const interceptor = (request: RequestInstance) => request;
      client.onRequest(interceptor).onAuth(interceptor).setDebug(true);

      client.clear();

      expect(client.unstable_onRequestCallbacks).toStrictEqual([interceptor]);
      expect(client.unstable_onAuthCallbacks).toStrictEqual([interceptor]);
      expect(client.debug).toBeTrue();
      expect(client.url).toBe("shared-base-url");
    });

    it("should send and cache the requests after the clear", async () => {
      const request = client.createRequest<{ response: Data }>()({ endpoint: "/users" });
      request.setMock(() => ({ data: { id: 1 }, status: 200 }));

      client.clear();
      const response = await request.send();

      expect(response.data).toStrictEqual({ id: 1 });
      expect(request.read()?.data).toStrictEqual({ id: 1 });
    });

    it("should be safe to clear the client many times", () => {
      expect(() => {
        client.clear();
        client.clear();
        client.clear();
      }).not.toThrow();
    });
  });
});
