import { AppManager } from "@hyper-fetch/core";
import { SocketAdapter } from "adapter";
import { ServerSentEventsAdapter } from "adapter-sse";
import { WebsocketAdapter } from "adapter-websockets";
import { Socket } from "socket";

import {
  ControlledEventSource,
  installControlledEventSource,
  uninstallControlledEventSource,
} from "../../utils/controlled-event-source";
import {
  ControlledWebSocket,
  flushPromises,
  installControlledWebSocket,
  uninstallControlledWebSocket,
} from "../../utils/controlled-websocket";

/** Adapters subscribe to the network state of the app manager - destroying the socket must remove that subscription */
describe("Socket Adapter [ Dispose ]", () => {
  let appManager: AppManager;

  beforeEach(() => {
    installControlledWebSocket();
    installControlledEventSource();
    appManager = new AppManager();
  });

  afterEach(() => {
    uninstallControlledWebSocket();
    uninstallControlledEventSource();
  });

  /** Goes offline and back online - adapters connect again on the online event */
  const goOnlineAgain = async () => {
    appManager.setOnline(false);
    appManager.setOnline(true);
    await flushPromises();
  };

  describe.each([
    ["WebSocket", () => WebsocketAdapter(), () => ControlledWebSocket.instances.length],
    ["SSE", () => ServerSentEventsAdapter(), () => ControlledEventSource.instances.length],
  ])("When using the %s adapter", (_, createAdapter, transports) => {
    it("should not connect a destroyed socket when the app goes online", async () => {
      const socket = new Socket({ url: "ws://dispose", adapter: createAdapter(), appManager: () => appManager });
      await flushPromises();
      await socket.destroy();
      const before = transports();

      await goOnlineAgain();

      expect(transports()).toBe(before);
    });

    it("should keep the other sockets of the app manager connecting when the app goes online", async () => {
      const destroyed = new Socket({ url: "ws://first", adapter: createAdapter(), appManager: () => appManager });
      const alive = new Socket({ url: "ws://second", adapter: createAdapter(), appManager: () => appManager });
      await flushPromises();
      await destroyed.destroy();
      // The connection attempt of the other socket was interrupted - it connects again once the app is online
      alive.adapter.setConnecting(false);
      const before = transports();

      await goOnlineAgain();

      expect(transports()).toBe(before + 1);
      await alive.destroy();
    });

    it("should remove the online subscription of the previous socket when the adapter is initialized again", async () => {
      const adapter = createAdapter();
      const first = new Socket({ url: "ws://first", adapter, appManager: () => appManager });
      await flushPromises();
      await first.disconnect();
      const onlineListeners = appManager.emitter.listenerCount("online");

      const second = new Socket({ url: "ws://second", adapter, appManager: () => appManager });
      await flushPromises();

      expect(appManager.emitter.listenerCount("online")).toBe(onlineListeners);
      await second.destroy();
    });
  });

  it("should leave no online subscription after destroy", async () => {
    const before = appManager.emitter.listenerCount("online");
    const socket = new Socket({ url: "ws://dispose", appManager: () => appManager });
    await flushPromises();
    expect(appManager.emitter.listenerCount("online")).toBe(before + 1);

    await socket.destroy();

    expect(appManager.emitter.listenerCount("online")).toBe(before);
  });

  it("should disconnect on destroy", async () => {
    const socket = new Socket({ url: "ws://dispose", appManager: () => appManager });
    await flushPromises();
    ControlledWebSocket.instances[0].serverOpen();
    await flushPromises();

    await socket.destroy();

    expect(socket.adapter.connected).toBeFalse();
    expect(ControlledWebSocket.instances[0].readyState).toBe(ControlledWebSocket.CLOSED);
  });

  it("should unmount the app manager the socket created itself", async () => {
    const socket = new Socket({ url: "ws://dispose" });
    const unmount = vi.spyOn(socket.appManager, "unmount");

    await socket.destroy();

    expect(unmount).toHaveBeenCalledTimes(1);
  });

  it("should not unmount an app manager passed to the socket", async () => {
    const socket = new Socket({ url: "ws://dispose", appManager: () => appManager });
    // `AppManager.initialize()` itself unmounts before mounting, so the spy starts after the socket was created
    const unmount = vi.spyOn(appManager, "unmount");

    await socket.destroy();

    expect(unmount).not.toHaveBeenCalled();
  });

  it("should call the dispose of a custom connector", async () => {
    const dispose = vi.fn();
    const adapter = new SocketAdapter({ name: "custom" }).setConnector(() => ({
      connect: () => {},
      reconnect: () => {},
      disconnect: () => {},
      listen: () => () => {},
      emit: () => {},
      dispose,
    }));
    const socket = new Socket({ url: "ws://dispose", adapter });

    await socket.destroy();

    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it("should accept connectors without dispose", async () => {
    const adapter = new SocketAdapter({ name: "custom" }).setConnector(() => ({
      connect: () => {},
      reconnect: () => {},
      disconnect: () => {},
      listen: () => () => {},
      emit: () => {},
    }));
    const socket = new Socket({ url: "ws://dispose", adapter });

    await expect(socket.destroy()).resolves.toBeUndefined();
  });
});
