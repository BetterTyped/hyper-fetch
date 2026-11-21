import { Client } from "client";
import { AppEvents, AppManager, hasDocument, hasWindow, isNavigatorOnline } from "managers";

import { createDeferred, flushPromises, getUnhandledRejections, removeGlobal } from "../../../utils/fixtures.utils";

const setVisibility = (state: "visible" | "hidden") => {
  vi.spyOn(document, "visibilityState", "get").mockReturnValue(state);
  document.dispatchEvent(new Event("visibilitychange"));
};

const createSpies = (manager: AppManager) => {
  const spies = { focus: vi.fn(), blur: vi.fn(), online: vi.fn(), offline: vi.fn() };
  manager.events.onFocus(spies.focus);
  manager.events.onBlur(spies.blur);
  manager.events.onOnline(spies.online);
  manager.events.onOffline(spies.offline);
  return spies;
};

describe("AppManager [ Events ]", () => {
  const managers: AppManager[] = [];

  const createManager = (...params: ConstructorParameters<typeof AppManager>) => {
    const manager = new AppManager(...params);
    managers.push(manager);
    return manager;
  };

  afterEach(() => {
    managers.splice(0).forEach((manager) => manager.unmount());
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("When the page unloads", () => {
    it("should start without unloading", () => {
      const manager = createManager();
      manager.initialize();

      expect(manager.isUnloading).toBeFalse();
    });

    it("should be unloading once the page gets hidden for good", () => {
      const manager = createManager();
      manager.initialize();

      window.dispatchEvent(new Event("pagehide"));

      expect(manager.isUnloading).toBeTrue();
    });

    it("should stop unloading when the page comes back from the back-forward cache", () => {
      const manager = createManager();
      manager.initialize();

      window.dispatchEvent(new Event("pagehide"));
      window.dispatchEvent(new Event("pageshow"));

      expect(manager.isUnloading).toBeFalse();
    });

    it("should not track the page after unmount", () => {
      const manager = createManager();
      manager.initialize();
      manager.unmount();

      window.dispatchEvent(new Event("pagehide"));

      expect(manager.isUnloading).toBeFalse();
    });
  });

  describe("When the document visibility changes", () => {
    it("should lose the focus when the document gets hidden", () => {
      const manager = createManager();
      const spies = createSpies(manager);
      manager.initialize();

      setVisibility("hidden");

      expect(manager.isFocused).toBeFalse();
      expect(spies.blur).toHaveBeenCalledTimes(1);
      expect(spies.focus).not.toHaveBeenCalled();
    });

    it("should get the focus back when the document gets visible", () => {
      const manager = createManager();
      const spies = createSpies(manager);
      manager.initialize();

      setVisibility("hidden");
      setVisibility("visible");

      expect(manager.isFocused).toBeTrue();
      expect(spies.blur).toHaveBeenCalledTimes(1);
      expect(spies.focus).toHaveBeenCalledTimes(1);
    });

    it("should not change the network state", () => {
      const manager = createManager();
      const spies = createSpies(manager);
      manager.initialize();

      setVisibility("hidden");

      expect(manager.isOnline).toBeTrue();
      expect(spies.online).not.toHaveBeenCalled();
      expect(spies.offline).not.toHaveBeenCalled();
    });
  });

  describe("When the state changes rapidly", () => {
    it("should emit every network change and end with the last state", () => {
      const manager = createManager();
      const order: string[] = [];
      manager.events.onOnline(() => order.push("online"));
      manager.events.onOffline(() => order.push("offline"));
      manager.initialize();

      for (let i = 0; i < 25; i += 1) {
        window.dispatchEvent(new Event("offline"));
        window.dispatchEvent(new Event("online"));
      }
      window.dispatchEvent(new Event("offline"));

      expect(order).toHaveLength(51);
      expect(order.slice(0, 4)).toStrictEqual(["offline", "online", "offline", "online"]);
      expect(order.at(-1)).toBe("offline");
      expect(manager.isOnline).toBeFalse();
    });

    it("should emit every focus change and end with the last state", () => {
      const manager = createManager();
      const spies = createSpies(manager);
      manager.initialize();

      for (let i = 0; i < 25; i += 1) {
        window.dispatchEvent(new Event("blur"));
        window.dispatchEvent(new Event("focus"));
      }

      expect(spies.blur).toHaveBeenCalledTimes(25);
      expect(spies.focus).toHaveBeenCalledTimes(25);
      expect(manager.isFocused).toBeTrue();
    });

    it("should expose the new state to the listeners", () => {
      const manager = createManager();
      const states: boolean[] = [];
      manager.events.onOffline(() => states.push(manager.isOnline));
      manager.events.onOnline(() => states.push(manager.isOnline));

      manager.setOnline(false);
      manager.setOnline(true);

      expect(states).toStrictEqual([false, true]);
    });
  });

  describe("When the listeners are managed", () => {
    it("should use the documented event names", () => {
      expect(AppEvents).toStrictEqual({ FOCUS: "focus", BLUR: "blur", ONLINE: "online", OFFLINE: "offline" });
    });

    it("should stop notifying the unsubscribed listeners", () => {
      const manager = createManager();
      const spy = vi.fn();
      const unsubscribes = [
        manager.events.onFocus(spy),
        manager.events.onBlur(spy),
        manager.events.onOnline(spy),
        manager.events.onOffline(spy),
      ];

      unsubscribes.forEach((unsubscribe) => unsubscribe());
      unsubscribes.forEach((unsubscribe) => unsubscribe());
      manager.setFocused(false);
      manager.setFocused(true);
      manager.setOnline(false);
      manager.setOnline(true);

      expect(spy).not.toHaveBeenCalled();
      expect(manager.emitter.eventNames()).toHaveLength(0);
    });

    it("should notify the remaining listeners when one of them unsubscribes during the emit", () => {
      const manager = createManager();
      const spy = vi.fn();
      const unsubscribe = manager.events.onOnline(() => unsubscribe());
      manager.events.onOnline(spy);

      manager.setOnline(true);
      manager.setOnline(true);

      expect(spy).toHaveBeenCalledTimes(2);
      expect(manager.emitter.listenerCount(AppEvents.ONLINE)).toBe(1);
    });

    it("should not share the state nor the listeners between the managers", () => {
      const first = createManager();
      const second = createManager();
      const spies = createSpies(second);

      first.setOnline(false);
      first.setFocused(false);

      expect(second.isOnline).toBeTrue();
      expect(second.isFocused).toBeTrue();
      Object.values(spies).forEach((spy) => expect(spy).not.toHaveBeenCalled());
    });

    it("should remove every browser listener it added", () => {
      const windowAdd = vi.spyOn(window, "addEventListener");
      const windowRemove = vi.spyOn(window, "removeEventListener");
      const documentAdd = vi.spyOn(document, "addEventListener");
      const documentRemove = vi.spyOn(document, "removeEventListener");
      const manager = createManager();

      manager.initialize();
      manager.unmount();

      expect(windowAdd.mock.calls.map(([name]) => name)).toIncludeSameMembers([
        "blur",
        "focus",
        "offline",
        "online",
        "pagehide",
        "pageshow",
      ]);
      expect(documentAdd.mock.calls.map(([name]) => name)).toStrictEqual(["visibilitychange"]);
      expect(windowRemove.mock.calls).toStrictEqual(windowAdd.mock.calls);
      expect(documentRemove.mock.calls).toStrictEqual(documentAdd.mock.calls);
    });

    it("should remove the browser listeners even when the window is already gone", () => {
      const manager = createManager();
      const spies = createSpies(manager);
      const browserWindow = window;
      manager.initialize();

      removeGlobal("window");
      expect(() => manager.unmount()).not.toThrow();
      vi.unstubAllGlobals();
      browserWindow.dispatchEvent(new Event("offline"));

      expect(spies.offline).not.toHaveBeenCalled();
    });
  });

  describe("When the custom event sources are used", () => {
    it("should pass the state setters to the custom sources", () => {
      let setFocused: (isFocused: boolean) => void = () => {};
      let setOnline: (isOnline: boolean) => void = () => {};
      const manager = createManager({
        focusEvent: (setter) => {
          setFocused = setter;
        },
        onlineEvent: (setter) => {
          setOnline = setter;
        },
      });
      const spies = createSpies(manager);
      manager.initialize();

      setFocused(false);
      setOnline(false);

      expect(manager.isFocused).toBeFalse();
      expect(manager.isOnline).toBeFalse();
      expect(spies.blur).toHaveBeenCalledTimes(1);
      expect(spies.offline).toHaveBeenCalledTimes(1);
    });

    it("should not listen to the browser events replaced by the custom sources", () => {
      const manager = createManager({ focusEvent: () => {}, onlineEvent: () => {} });
      const spies = createSpies(manager);
      manager.initialize();

      window.dispatchEvent(new Event("offline"));
      window.dispatchEvent(new Event("blur"));
      setVisibility("hidden");

      expect(manager.isOnline).toBeTrue();
      expect(manager.isFocused).toBeTrue();
      Object.values(spies).forEach((spy) => expect(spy).not.toHaveBeenCalled());
    });

    it("should not subscribe to the sources before the manager is initialized", () => {
      const focusEvent = vi.fn();
      const onlineEvent = vi.fn();

      const manager = createManager({ focusEvent, onlineEvent });
      expect(focusEvent).not.toHaveBeenCalled();
      expect(onlineEvent).not.toHaveBeenCalled();

      manager.initialize();
      expect(focusEvent).toHaveBeenCalledTimes(1);
      expect(onlineEvent).toHaveBeenCalledTimes(1);
    });

    it("should accept the sources which return no cleanup", () => {
      const manager = createManager({ focusEvent: () => {}, onlineEvent: () => {} });

      manager.initialize();

      expect(() => manager.unmount()).not.toThrow();
    });
  });

  describe("When the initial state is read", () => {
    it("should emit the change when the asynchronous getters resolve with true", async () => {
      const online = createDeferred<boolean>();
      const focused = createDeferred<boolean>();
      const manager = createManager({ initiallyOnline: () => online.promise, initiallyFocused: () => focused.promise });
      const spies = createSpies(manager);

      expect(manager.isOnline).toBeFalse();
      expect(manager.isFocused).toBeFalse();
      online.resolve(true);
      focused.resolve(true);
      await flushPromises();

      expect(manager.isOnline).toBeTrue();
      expect(manager.isFocused).toBeTrue();
      expect(spies.online).toHaveBeenCalledTimes(1);
      expect(spies.focus).toHaveBeenCalledTimes(1);
    });

    it("should not emit anything when the asynchronous getters resolve with false", async () => {
      const manager = createManager({ initiallyOnline: async () => false, initiallyFocused: async () => false });
      const spies = createSpies(manager);

      await flushPromises();

      expect(manager.isOnline).toBeFalse();
      expect(manager.isFocused).toBeFalse();
      Object.values(spies).forEach((spy) => expect(spy).not.toHaveBeenCalled());
    });

    it("should keep the state reported by the environment before the getter resolved", async () => {
      const online = createDeferred<boolean>();
      const focused = createDeferred<boolean>();
      const manager = createManager({ initiallyOnline: () => online.promise, initiallyFocused: () => focused.promise });
      manager.setOnline(true);
      manager.setOnline(false);
      manager.setFocused(true);
      manager.setFocused(false);
      const spies = createSpies(manager);

      online.resolve(true);
      focused.resolve(true);
      await flushPromises();

      expect(manager.isOnline).toBeFalse();
      expect(manager.isFocused).toBeFalse();
      Object.values(spies).forEach((spy) => expect(spy).not.toHaveBeenCalled());
    });

    it("should assume the positive state when the asynchronous getters reject", async () => {
      let manager: AppManager | undefined;

      const rejections = await getUnhandledRejections(() => {
        manager = createManager({
          initiallyOnline: () => Promise.reject(new Error("Unknown network state")),
          initiallyFocused: () => Promise.reject(new Error("Unknown focus state")),
        });
      });

      expect(rejections).toHaveLength(0);
      expect(manager?.isOnline).toBeTrue();
      expect(manager?.isFocused).toBeTrue();
    });

    it("should assume the positive state when the getters throw", () => {
      const getter = () => {
        throw new Error("Unknown state");
      };

      const manager = createManager({ initiallyOnline: getter, initiallyFocused: getter });

      expect(manager.isOnline).toBeTrue();
      expect(manager.isFocused).toBeTrue();
    });

    it("should send the requests waiting for the asynchronous network state", async () => {
      const online = createDeferred<boolean>();
      const client = new Client({
        url: "shared-base-url",
        appManager: () => new AppManager({ initiallyOnline: () => online.promise }),
      });
      const mock = vi.fn(() => ({ data: { id: 1 }, status: 200 }));
      const request = client.createRequest<{ response: { id: number } }>()({ endpoint: "/users" });
      request.setMock(mock);

      const pending = request.send();
      await flushPromises();
      expect(mock).not.toHaveBeenCalled();

      online.resolve(true);
      const response = await pending;

      expect(response.data).toStrictEqual({ id: 1 });
      client.clear();
    });
  });

  describe("When there is no browser environment", () => {
    it("should detect the missing window and document", () => {
      removeGlobal("window");

      expect(hasWindow()).toBeFalse();
      expect(hasDocument()).toBeFalse();
    });

    it("should not treat the window without the event listeners as the browser", () => {
      vi.stubGlobal("window", {});

      expect(hasWindow()).toBeFalse();
      expect(hasDocument()).toBeFalse();
    });

    it("should detect the window without the document", () => {
      vi.stubGlobal("window", { addEventListener: () => {}, removeEventListener: () => {} });

      expect(hasWindow()).toBeTrue();
      expect(hasDocument()).toBeFalse();
    });

    it("should assume the online state without the navigator", () => {
      removeGlobal("navigator");

      expect(isNavigatorOnline()).toBeTrue();
      expect(createManager().isOnline).toBeTrue();
    });

    it("should initialize and unmount without the window", () => {
      removeGlobal("window");
      const manager = createManager();

      expect(() => manager.initialize()).not.toThrow();
      expect(() => manager.unmount()).not.toThrow();
      expect(manager.isBrowser).toBeFalse();
      expect(manager.isFocused).toBeTrue();
      expect(manager.isOnline).toBeTrue();
    });

    it("should still emit the state changes set manually", () => {
      removeGlobal("window");
      const manager = createManager();
      const spies = createSpies(manager);
      manager.initialize();

      manager.setOnline(false);
      manager.setFocused(false);

      expect(spies.offline).toHaveBeenCalledTimes(1);
      expect(spies.blur).toHaveBeenCalledTimes(1);
    });

    it("should use the custom sources without the window", () => {
      removeGlobal("window");
      let setOnline: (isOnline: boolean) => void = () => {};
      const cleanup = vi.fn();
      const manager = createManager({
        onlineEvent: (setter) => {
          setOnline = setter;
          return cleanup;
        },
      });
      manager.initialize();

      setOnline(false);
      manager.unmount();

      expect(manager.isOnline).toBeFalse();
      expect(cleanup).toHaveBeenCalledTimes(1);
    });
  });
});
