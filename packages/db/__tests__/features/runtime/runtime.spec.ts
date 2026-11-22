import type { ListenerInstance } from "@hyper-fetch/sockets";

import { DbRuntime } from "../../../src/db/db.runtime";
import { Tabs } from "../../../src/persistence/tabs";
import { SyncSubscription } from "../../../src/sync/sync";
import { applyListenerPatches, applyRequestPatches, createId } from "../../../src/utils/request.utils";
import { createHttpClient, createListeners, createSocket } from "../../utils/fixtures";

describe("Request patches", () => {
  const client = createHttpClient();
  const request = client.createRequest<{
    response: unknown;
    payload: unknown;
    queryParams?: Record<string, number> | string;
  }>()({
    endpoint: "/items/:itemId",
    method: "POST",
  });

  it("merges params, object query params and object payloads into what the request has", () => {
    const patched = applyRequestPatches(request, [
      { params: { itemId: 1 }, queryParams: { a: 1 }, payload: { a: 1 } },
      { queryParams: { b: 2 }, payload: { b: 2 } },
      {},
    ]);
    expect(patched.params).toStrictEqual({ itemId: 1 });
    expect(patched.queryParams).toStrictEqual({ a: 1, b: 2 });
    expect(patched.payload).toStrictEqual({ a: 1, b: 2 });
  });

  it("adds up array query params, such as Firestore constraints", () => {
    const patched = applyRequestPatches(request, [{ payload: [1] }, { payload: [2] }]);
    expect(patched.payload).toStrictEqual([1, 2]);
  });

  it("replaces string query params and values that are not objects", () => {
    const patched = applyRequestPatches(request, [
      { queryParams: { a: 1 }, payload: [1] },
      { queryParams: "raw=1", payload: "text" },
    ]);
    expect(patched.queryParams).toBe("raw=1");
    expect(patched.payload).toBe("text");
  });

  it("applies listener patches", () => {
    const { onPostChanged } = createListeners(createSocket());
    const patched = applyListenerPatches(onPostChanged as unknown as ListenerInstance, [
      { params: { teamId: 1 } },
      { payload: { a: 1 } },
      { payload: { b: 2 }, queryParams: { limit: 1 } },
      {},
    ]);
    expect(patched.topic).toBe("teams/1/posts/changed");
    expect(patched.payload).toStrictEqual({ a: 1, b: 2 });
    expect(patched.queryParams).toStrictEqual({ limit: 1 });
  });

  it("creates ids without crypto.randomUUID", () => {
    vi.stubGlobal("crypto", {});
    const first = createId();
    const second = createId();
    vi.unstubAllGlobals();
    expect(first).not.toBe(second);
    expect(createId()).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe("Tabs", () => {
  it("leads at once without Web Locks and works without a channel", () => {
    vi.stubGlobal("BroadcastChannel", void 0);
    const onLeader = vi.fn();
    const tabs = new Tabs("db", undefined, { onLeader, onMessage: vi.fn() });
    vi.unstubAllGlobals();
    tabs.start();
    tabs.post({ type: "leader" });
    expect(onLeader).toHaveBeenCalledOnce();
    expect(tabs.isLeader).toBeTrue();
    tabs.close();
    expect(tabs.isLeader).toBeFalse();
    expect(() => tabs.post({ type: "leader" })).not.toThrow();
  });

  it("does not post to a channel it closed", () => {
    const channel = new BroadcastChannel("db-closed");
    const tabs = new Tabs("db", { channel: channel as never }, { onLeader: vi.fn(), onMessage: vi.fn() });
    tabs.start();
    tabs.close();
    expect(() => tabs.post({ type: "leader" })).not.toThrow();
  });

  it("uses the Web Locks of the environment", () => {
    const request = vi.fn(() => Promise.resolve());
    vi.stubGlobal("navigator", { locks: { request } });
    const tabs = new Tabs("db", undefined, { onLeader: vi.fn(), onMessage: vi.fn() });
    vi.unstubAllGlobals();
    tabs.start();
    expect(request).toHaveBeenCalledWith("db:leader", expect.any(Function));
    tabs.close();
  });

  it("leads only once it holds the lock, and releases it on close", async () => {
    let grant: (() => Promise<unknown>) | undefined;
    const locks = {
      request: (_name: string, callback: () => Promise<unknown>) => {
        grant = callback;
        return Promise.resolve();
      },
    };
    const onLeader = vi.fn();
    const tabs = new Tabs("db", { locks }, { onLeader, onMessage: vi.fn() });
    tabs.start();
    expect(onLeader).not.toHaveBeenCalled();
    const held = grant!();
    expect(onLeader).toHaveBeenCalledOnce();
    tabs.close();
    await expect(held).resolves.toBeUndefined();
  });
});

describe("SyncSubscription", () => {
  const createFakeListener = () => {
    const lifecycle: { onStart?: () => void; onEnd?: () => void; callback?: (event: { data: unknown }) => void } = {};
    const unsubscribe = vi.fn();
    const listener = {
      topic: "topic",
      socket: { adapter: { connected: true } },
      listen: (callback: (event: { data: unknown }) => void, options: { onStart: () => void; onEnd: () => void }) => {
        lifecycle.callback = callback;
        lifecycle.onStart = options.onStart;
        lifecycle.onEnd = options.onEnd;
        return unsubscribe;
      },
    };
    return { listener: listener as unknown as ListenerInstance, lifecycle, unsubscribe };
  };

  it("restarts after the server ended the subscription and buffers until every user loaded", () => {
    const { listener, lifecycle, unsubscribe } = createFakeListener();
    const applied: unknown[] = [];
    const host = {
      tick: () => 1,
      applySyncMessage: (_sync: unknown, message: unknown) => applied.push(message),
      onLiveChange: vi.fn(),
      onRemove: vi.fn(),
    };
    const subscription = new SyncSubscription({ id: "id", sync: { listener, type: "update" }, listener, host });
    const first = {};
    const second = {};
    subscription.addUser(first);
    lifecycle.onStart!();
    expect(subscription.isLive()).toBeTrue();
    lifecycle.onEnd!();
    expect(subscription.isLive()).toBeFalse();
    expect(host.onLiveChange).toHaveBeenCalledTimes(2);

    subscription.addUser(second);
    subscription.beginLoad(first);
    subscription.beginLoad(second);
    lifecycle.callback!({ data: "buffered" });
    subscription.endLoad(first);
    expect(applied).toStrictEqual([]);
    subscription.endLoad(second);
    expect(applied).toStrictEqual(["buffered"]);

    subscription.removeUser(first);
    expect(host.onRemove).not.toHaveBeenCalled();
    subscription.removeUser(second);
    expect(unsubscribe).toHaveBeenCalledOnce();
    expect(host.onRemove).toHaveBeenCalledWith(subscription);
  });

  it("clears the timers of sync waits when the db is destroyed", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    try {
      const runtime = new DbRuntime({});
      const wait = runtime.waitForSync({ collection: "post", key: 1, since: 0, timeout: 10_000 });
      expect(wait).toBeInstanceOf(Promise);
      expect(vi.getTimerCount()).toBe(1);
      runtime.destroy();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
