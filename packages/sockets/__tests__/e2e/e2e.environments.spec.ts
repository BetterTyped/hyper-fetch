/**
 * @vitest-environment node
 */
import { ServerSentEventsAdapter, Socket } from "@hyper-fetch/sockets";
import { createSseE2EServer, createWebsocketE2EServer, waitForConnection } from "@hyper-fetch/testing";
import { EventSource as NodeEventSource } from "eventsource";
import { WebSocket as NodeWebSocket } from "ws";

import { withoutImplementation as withoutGlobal } from "../utils/environment.utils";
import { nativeWebSocket } from "../vitest.setup";

const websocketServer = createWebsocketE2EServer();
const sseServer = createSseE2EServer();

describe("E2E [ Environments ]", () => {
  let websocketUrl: string;
  let sseUrl: string;
  let browserWindow: unknown;

  beforeAll(async () => {
    websocketUrl = await websocketServer.startServer();
    sseUrl = await sseServer.startServer();
    // Like any Node.js app: no window, only globals
    browserWindow = Reflect.get(globalThis, "window");
    Reflect.deleteProperty(globalThis, "window");
  });

  afterAll(async () => {
    Object.assign(globalThis, { window: browserWindow });
    await websocketServer.stopServer();
    await sseServer.stopServer();
  });

  it("should run without a window", () => {
    expect(typeof window).toBe("undefined");
  });

  describe("given the websocket adapter", () => {
    it("should connect with the native WebSocket of Node.js", async () => {
      expect(nativeWebSocket).toBeFunction();
      const socket = new Socket({
        url: websocketUrl,
        adapterOptions: { autoConnect: false, WebSocket: nativeWebSocket },
      });

      await socket.connect();
      await waitForConnection(socket);

      expect(socket.adapter.connected).toBeTrue();
      await socket.disconnect();
    });

    it("should connect with the global WebSocket when none is passed", async () => {
      expect(globalThis.WebSocket).toBeFunction();
      const socket = new Socket({ url: websocketUrl, adapterOptions: { autoConnect: false } });

      await socket.connect();
      await waitForConnection(socket);

      expect(socket.adapter.connected).toBeTrue();
      await socket.disconnect();
    });

    it("should connect with ws passed as WebSocket when there is no global WebSocket", async () => {
      await withoutGlobal("WebSocket", async () => {
        const socket = new Socket({
          url: websocketUrl,
          adapterOptions: { autoConnect: false, WebSocket: NodeWebSocket as unknown as typeof WebSocket },
        });

        await socket.connect();
        await waitForConnection(socket);

        expect(socket.adapter.connected).toBeTrue();
        await socket.disconnect();
        expect(socket.adapter.connected).toBeFalse();
      });
    });

    it("should exchange messages through the passed WebSocket", async () => {
      await withoutGlobal("WebSocket", async () => {
        const socket = new Socket({
          url: websocketUrl,
          adapterOptions: { autoConnect: false, WebSocket: NodeWebSocket as unknown as typeof WebSocket },
        });
        const clientPromise = websocketServer.waitForClient();
        await socket.connect();
        await waitForConnection(socket);
        const client = await clientPromise;
        const received = vi.fn();
        socket.createListener<{ value: number }>()({ topic: "numbers" }).listen(received);

        client.send(JSON.stringify({ topic: "numbers", data: { value: 7 } }));

        await vi.waitFor(() => expect(received).toHaveBeenCalledWith(expect.objectContaining({ data: { value: 7 } })));
        await socket.disconnect();
      });
    });

    it("should fail the connection when there is no WebSocket at all", async () => {
      await withoutGlobal("WebSocket", async () => {
        const onError = vi.fn();
        const socket = new Socket({ url: websocketUrl, reconnect: 0, adapterOptions: { autoConnect: false } });
        socket.events.onError(onError);

        await socket.connect();

        await vi.waitFor(() => expect(onError).toHaveBeenCalled());
        expect(socket.adapter.connected).toBeFalse();
      });
    });
  });

  describe("given the sse adapter", () => {
    it("should connect with eventsource passed as EventSource when there is no global EventSource", async () => {
      await withoutGlobal("EventSource", async () => {
        const socket = new Socket({
          url: sseUrl,
          adapter: ServerSentEventsAdapter(),
          adapterOptions: { autoConnect: false, EventSource: NodeEventSource as unknown as typeof EventSource },
        });

        await socket.connect();
        await waitForConnection(socket);

        expect(socket.adapter.connected).toBeTrue();
        await socket.disconnect();
      });
    });

    it("should fail the connection when there is no EventSource at all", async () => {
      await withoutGlobal("EventSource", async () => {
        const onError = vi.fn();
        const socket = new Socket({
          url: sseUrl,
          reconnect: 0,
          adapter: ServerSentEventsAdapter(),
          adapterOptions: { autoConnect: false },
        });
        socket.events.onError(onError);

        await socket.connect();

        await vi.waitFor(() => expect(onError).toHaveBeenCalled());
        expect(socket.adapter.connected).toBeFalse();
      });
    });
  });
});
