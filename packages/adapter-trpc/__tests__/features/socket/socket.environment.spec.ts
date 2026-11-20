import { AppManager } from "@hyper-fetch/core";
import { Socket } from "@hyper-fetch/sockets";

import { TrpcSseAdapter, TrpcWebsocketAdapter } from "../../../src";
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

/** Removes a global for one test, like a runtime that does not have it */
const withoutGlobal = async (name: "WebSocket" | "EventSource", run: () => Promise<void>) => {
  const original = globalThis[name];
  delete globalThis[name];
  try {
    await run();
  } finally {
    Object.assign(globalThis, { [name]: original });
  }
};

describe("Trpc Socket Adapters [ Environment ]", () => {
  let appManager = new AppManager();

  beforeEach(() => {
    installControlledWebSocket();
    installControlledEventSource();
    appManager = new AppManager();
  });

  afterEach(() => {
    uninstallControlledWebSocket();
    uninstallControlledEventSource();
  });

  describe("when the socket is destroyed", () => {
    const goOnlineAgain = async () => {
      appManager.setOnline(false);
      appManager.setOnline(true);
      await flushPromises();
    };

    /** Transports created by both adapters, a connection attempt of either one creates one */
    const transports = () => ControlledWebSocket.instances.length + ControlledEventSource.instances.length;

    describe.each([
      ["WebSocket", () => TrpcWebsocketAdapter(), "ws://localhost:3001"],
      ["SSE", () => TrpcSseAdapter(), "http://localhost:3000/trpc"],
    ] as const)("with the %s adapter", (_name, createAdapter, url) => {
      it("should not connect when the app goes online", async () => {
        const socket = new Socket({ url, adapter: createAdapter(), appManager: () => appManager });
        await flushPromises();
        socket.createListener<number>()({ topic: "onTick" }).listen(vi.fn());
        await socket.destroy();
        // Without the dispose, only `forceClosed` would keep it closed - the online subscription has to be gone
        socket.adapter.setForceClosed(false);
        const before = transports();

        await goOnlineAgain();

        expect(transports()).toBe(before);
        expect(socket.adapter.connected).toBeFalse();
        expect(socket.adapter.connecting).toBeFalse();
      });

      it("should leave no online listener on the app manager", async () => {
        const before = appManager.emitter.listenerCount("online");
        const socket = new Socket({ url, adapter: createAdapter(), appManager: () => appManager });
        await flushPromises();
        expect(appManager.emitter.listenerCount("online")).toBe(before + 1);

        await socket.destroy();

        expect(appManager.emitter.listenerCount("online")).toBe(before);
      });

      it("should keep the other sockets of the app manager following the network", async () => {
        const destroyed = new Socket({ url, adapter: createAdapter(), appManager: () => appManager });
        const alive = new Socket({ url, adapter: createAdapter(), appManager: () => appManager });
        await flushPromises();
        await destroyed.destroy();
        await alive.disconnect();
        // Dropped by the network, not closed on purpose - the online event brings it back
        alive.adapter.setForceClosed(false);
        alive.createListener<number>()({ topic: "onTick" }).listen(vi.fn());
        const before = transports();

        await goOnlineAgain();

        expect(transports()).toBe(before + 1);
        await alive.destroy();
      });
    });
  });

  describe("when passing the transport constructor", () => {
    it("should open the WebSocket with the given constructor", async () => {
      await withoutGlobal("WebSocket", async () => {
        const socket = new Socket({
          url: "ws://localhost:3001",
          adapter: TrpcWebsocketAdapter(),
          adapterOptions: { WebSocket: ControlledWebSocket as unknown as typeof WebSocket },
        });
        await flushPromises();

        expect(ControlledWebSocket.instances).toHaveLength(1);
        ControlledWebSocket.last.serverOpen();
        await flushPromises();
        expect(socket.adapter.connected).toBeTrue();
        await socket.destroy();
      });
    });

    it("should report a missing WebSocket", async () => {
      await withoutGlobal("WebSocket", async () => {
        const socket = new Socket({ url: "ws://localhost:3001", adapter: TrpcWebsocketAdapter() });
        const errors: Error[] = [];
        socket.onError(({ error }) => {
          errors.push(error as Error);
        });
        await flushPromises();

        expect(errors.map(({ message }) => message)).toStrictEqual(["WebSocket is not available in this environment"]);
        await socket.destroy();
      });
    });

    it("should open the streams with the given EventSource", async () => {
      await withoutGlobal("EventSource", async () => {
        const socket = new Socket({
          url: "http://localhost:3000/trpc",
          adapter: TrpcSseAdapter(),
          adapterOptions: { EventSource: ControlledEventSource as unknown as typeof EventSource },
        });
        await flushPromises();

        socket.createListener<number>()({ topic: "onTick" }).listen(vi.fn());

        expect(ControlledEventSource.instances).toHaveLength(1);
        expect(ControlledEventSource.last.url).toBe("http://localhost:3000/trpc/onTick");
        await socket.destroy();
      });
    });

    it("should report a missing EventSource", async () => {
      await withoutGlobal("EventSource", async () => {
        const socket = new Socket({ url: "http://localhost:3000/trpc", adapter: TrpcSseAdapter() });
        const errors: Error[] = [];
        socket.onError(({ error }) => {
          errors.push(error as Error);
        });
        await flushPromises();

        socket.createListener<number>()({ topic: "onTick" }).listen(vi.fn());

        expect(errors.map(({ message }) => message)).toStrictEqual([
          "EventSource is not available in this environment",
        ]);
        await socket.destroy();
      });
    });
  });
});
