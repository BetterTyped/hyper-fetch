import { AppManager } from "@hyper-fetch/core";
import { createWebsocketMockingServer, waitForConnection } from "@hyper-fetch/testing";
import { waitFor } from "@testing-library/dom";
import type { Socket } from "socket";

import type { WebsocketAdapterType } from "../../../src/adapter-websockets/websocket-adapter";
import { createSocket } from "../../utils/socket.utils";

const setNavigatorOnline = (value: boolean) => {
  return vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(value);
};

describe("Socket [ App Manager ]", () => {
  const { url, startServer, stopServer } = createWebsocketMockingServer();
  const sockets: Socket<WebsocketAdapterType>[] = [];

  const create = (...args: Parameters<typeof createSocket<WebsocketAdapterType>>) => {
    const socket = createSocket<WebsocketAdapterType>({ url, ...args[0] });
    sockets.push(socket);
    return socket;
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    startServer();
  });

  afterEach(async () => {
    await Promise.all(sockets.map((socket) => socket.disconnect()));
    // Remove the window listeners so the sockets of other tests do not react to the dispatched events
    sockets.forEach((socket) => socket.appManager.unmount());
    sockets.length = 0;
    vi.restoreAllMocks();
    stopServer();
  });

  describe("When the browser network state changes", () => {
    it("should react to the window offline and online events", () => {
      const socket = create({ adapterOptions: { autoConnect: false } });
      const onOnline = vi.fn();
      const onOffline = vi.fn();

      socket.appManager.events.onOnline(onOnline);
      socket.appManager.events.onOffline(onOffline);

      window.dispatchEvent(new Event("offline"));

      expect(socket.appManager.isOnline).toBeFalse();
      expect(onOffline).toHaveBeenCalledTimes(1);
      expect(onOnline).not.toHaveBeenCalled();

      window.dispatchEvent(new Event("online"));

      expect(socket.appManager.isOnline).toBeTrue();
      expect(onOnline).toHaveBeenCalledTimes(1);
      expect(onOffline).toHaveBeenCalledTimes(1);
    });

    it("should reconnect when the browser comes back online", async () => {
      const socket = create();
      await waitForConnection(socket);

      window.dispatchEvent(new Event("offline"));
      await socket.disconnect();
      expect(socket.adapter.connected).toBeFalse();

      const onConnected = vi.fn();
      socket.events.onConnected(onConnected);
      window.dispatchEvent(new Event("online"));

      await waitFor(() => {
        expect(onConnected).toHaveBeenCalledTimes(1);
        expect(socket.adapter.connected).toBeTrue();
      });
    });

    it("should not connect while the browser is offline", async () => {
      const socket = create({ adapterOptions: { autoConnect: false } });

      window.dispatchEvent(new Event("offline"));
      await socket.connect();

      expect(socket.adapter.connected).toBeFalse();
      expect(socket.adapter.connecting).toBeFalse();
    });

    it("should stop reacting to the browser events after unmounting the app manager", () => {
      const socket = create({ adapterOptions: { autoConnect: false } });
      const onOffline = vi.fn();
      socket.appManager.events.onOffline(onOffline);

      socket.appManager.unmount();
      window.dispatchEvent(new Event("offline"));

      expect(socket.appManager.isOnline).toBeTrue();
      expect(onOffline).not.toHaveBeenCalled();
    });
  });

  describe("When the browser is offline from the beginning", () => {
    it("should start offline and skip the automatic connection", async () => {
      setNavigatorOnline(false);
      const onConnecting = vi.fn();

      const socket = create();
      socket.events.onConnecting(onConnecting);

      expect(socket.appManager.isOnline).toBeFalse();
      expect(socket.adapter.connecting).toBeFalse();
      // Runs the same guarded connection path, so any pending attempt has settled afterwards
      await socket.connect();
      expect(socket.adapter.connected).toBeFalse();
      expect(socket.adapter.connecting).toBeFalse();
      expect(onConnecting).not.toHaveBeenCalled();
    });

    it("should connect automatically once the browser goes online", async () => {
      setNavigatorOnline(false);
      const socket = create();
      expect(socket.adapter.connected).toBeFalse();

      window.dispatchEvent(new Event("online"));

      await waitForConnection(socket);
      expect(socket.appManager.isOnline).toBeTrue();
    });
  });

  describe("When using a custom app manager", () => {
    it("should use and initialize the app manager from the options", () => {
      const onlineEvent = vi.fn();
      const focusEvent = vi.fn();
      const appManager = new AppManager({ onlineEvent, focusEvent });

      const socket = create({ appManager: () => appManager, adapterOptions: { autoConnect: false } });

      expect(socket.appManager).toBe(appManager);
      expect(onlineEvent).toHaveBeenCalledTimes(1);
      expect(onlineEvent).toHaveBeenCalledWith(appManager.setOnline);
      expect(focusEvent).toHaveBeenCalledTimes(1);
    });

    it("should initialize the app manager before the adapter connects", () => {
      const socket = create({
        appManager: () => new AppManager({ initiallyOnline: false, onlineEvent: () => {} }),
      });

      expect(socket.appManager.isOnline).toBeFalse();
      expect(socket.adapter.connecting).toBeFalse();
    });

    it("should track a custom network source and clean it up", async () => {
      let setOnline: ((isOnline: boolean) => void) | undefined;
      const unsubscribe = vi.fn();
      const socket = create({
        appManager: () =>
          new AppManager({
            initiallyOnline: false,
            onlineEvent: (callback) => {
              setOnline = callback;
              return unsubscribe;
            },
          }),
      });

      expect(socket.adapter.connected).toBeFalse();
      setOnline?.(true);
      await waitForConnection(socket);

      socket.appManager.unmount();
      expect(unsubscribe).toHaveBeenCalledTimes(1);
    });

    it("should create a separate default app manager for every socket", () => {
      const first = create({ adapterOptions: { autoConnect: false } });
      const second = create({ adapterOptions: { autoConnect: false } });

      expect(first.appManager).toBeInstanceOf(AppManager);
      expect(first.appManager).not.toBe(second.appManager);
    });
  });
});
