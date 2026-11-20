import { ServerSentEventsAdapter } from "adapter-sse";
import { WebsocketAdapter } from "adapter-websockets";
import { Socket } from "socket";

import { ControlledEventSource } from "../../utils/controlled-event-source";
import { ControlledWebSocket, flushPromises } from "../../utils/controlled-websocket";

/**
 * The adapters find the transport on `globalThis` (browsers, Node 22+, Bun, Deno) or take a constructor from
 * `adapterOptions`, e.g. the `ws` or `eventsource` packages.
 */
describe("Socket Adapter [ Runtime ]", () => {
  const sockets: Socket<any>[] = [];
  const restores: VoidFunction[] = [];

  /** The test setup defines `EventSource` as a writable, non-configurable global - it can be assigned only */
  const setEventSource = (value: unknown) => {
    const original = globalThis.EventSource;
    globalThis.EventSource = value as typeof EventSource;
    restores.push(() => {
      globalThis.EventSource = original;
    });
  };

  beforeEach(() => {
    ControlledWebSocket.reset();
    ControlledEventSource.reset();
  });

  afterEach(async () => {
    await Promise.all(sockets.map((socket) => socket.disconnect()));
    sockets.length = 0;
    vi.unstubAllGlobals();
    restores.splice(0).forEach((restore) => restore());
  });

  describe("When using the WebSocket adapter", () => {
    it("should use the WebSocket constructor from the adapter options", async () => {
      const socket = new Socket({
        url: "ws://runtime",
        adapter: WebsocketAdapter(),
        adapterOptions: { WebSocket: ControlledWebSocket as unknown as typeof WebSocket },
      });
      sockets.push(socket);
      await flushPromises();

      expect(ControlledWebSocket.instances).toHaveLength(1);
      expect(ControlledWebSocket.instances[0].url).toBe("ws://runtime");
    });

    it("should find WebSocket on globalThis when there is no window", async () => {
      vi.stubGlobal("WebSocket", ControlledWebSocket);
      vi.stubGlobal("window", null);
      const socket = new Socket({ url: "ws://runtime", adapter: WebsocketAdapter() });
      sockets.push(socket);
      await flushPromises();

      expect(ControlledWebSocket.instances).toHaveLength(1);
    });

    it("should report a failed attempt when no WebSocket is available", async () => {
      vi.stubGlobal("WebSocket", null);
      const onError = vi.fn();
      const socket = new Socket({ url: "ws://runtime", adapter: WebsocketAdapter() }).onError(onError);
      sockets.push(socket);
      await flushPromises();

      expect(onError).toHaveBeenCalledWith({ error: new Error("WebSocket is not available in this environment") });
      expect(socket.adapter.connecting).toBeFalse();
    });
  });

  describe("When using the SSE adapter", () => {
    it("should use the EventSource constructor from the adapter options", async () => {
      const socket = new Socket({
        url: "http://runtime",
        adapter: ServerSentEventsAdapter(),
        adapterOptions: { EventSource: ControlledEventSource as unknown as typeof EventSource },
      });
      sockets.push(socket);
      await flushPromises();

      expect(ControlledEventSource.instances).toHaveLength(1);
      expect(ControlledEventSource.instances[0].url).toBe("http://runtime");
    });

    it("should find EventSource on globalThis when there is no window", async () => {
      setEventSource(ControlledEventSource);
      vi.stubGlobal("window", null);
      const socket = new Socket({ url: "http://runtime", adapter: ServerSentEventsAdapter() });
      sockets.push(socket);
      await flushPromises();

      expect(ControlledEventSource.instances).toHaveLength(1);
    });

    it("should report a failed attempt when no EventSource is available", async () => {
      setEventSource(null);
      const onError = vi.fn();
      const socket = new Socket({ url: "http://runtime", adapter: ServerSentEventsAdapter() }).onError(onError);
      sockets.push(socket);
      await flushPromises();

      expect(onError).toHaveBeenCalledWith({ error: new Error("EventSource is not available in this environment") });
      expect(socket.adapter.connecting).toBeFalse();
    });
  });
});
