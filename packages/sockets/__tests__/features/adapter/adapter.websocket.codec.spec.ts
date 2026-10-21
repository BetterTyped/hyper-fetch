import { createWebsocketMockingServer, waitForConnection } from "@hyper-fetch/testing";
import { waitFor } from "@testing-library/dom";
import type { WebsocketAdapterOptionsType } from "adapter-websockets";

import { createSocket } from "../../utils/socket.utils";

const decode: WebsocketAdapterOptionsType["decode"] = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === "ping") {
    return null;
  }
  return { topic: message.type, data: message.payload };
};

const encode: WebsocketAdapterOptionsType["encode"] = ({ topic, payload }) => JSON.stringify({ type: topic, payload });

describe("Websocket Adapter [ Encode / Decode ]", () => {
  const { getServer, startServer, stopServer } = createWebsocketMockingServer();

  beforeEach(() => {
    vi.resetAllMocks();
    startServer();
  });

  afterEach(() => {
    stopServer();
  });

  describe("When using the default message format", () => {
    it("should receive { topic, data } frames", async () => {
      const socket = createSocket();
      await waitForConnection(socket);
      const spy = vi.fn();
      socket
        .createListener<{ name: string }>()({ topic: "user" })
        .listen(({ data }) => spy(data));

      getServer().send(JSON.stringify({ topic: "user", data: { name: "Alice" } }));

      await waitFor(() => {
        expect(spy).toHaveBeenCalledWith({ name: "Alice" });
      });
    });

    it("should send { topic, data } frames", async () => {
      const socket = createSocket();
      await waitForConnection(socket);

      socket
        .createEmitter<{ name: string }>()({ topic: "user" })
        .emit({ payload: { name: "Alice" } });

      await expect(getServer()).toReceiveMessage(JSON.stringify({ topic: "user", data: { name: "Alice" } }));
    });
  });

  describe("When using custom decode", () => {
    it("should map incoming frames to listener topics", async () => {
      const socket = createSocket({ adapterOptions: { decode } });
      await waitForConnection(socket);
      const spy = vi.fn();
      const other = vi.fn();
      socket
        .createListener<{ name: string }>()({ topic: "user" })
        .listen(({ data }) => spy(data));
      socket.createListener()({ topic: "other" }).listen(other);

      getServer().send(JSON.stringify({ type: "user", payload: { name: "Alice" } }));

      await waitFor(() => {
        expect(spy).toHaveBeenCalledWith({ name: "Alice" });
      });
      expect(other).not.toHaveBeenCalled();
    });

    it("should pass the original MessageEvent as extra", async () => {
      const socket = createSocket({ adapterOptions: { decode } });
      await waitForConnection(socket);
      const spy = vi.fn();
      socket
        .createListener()({ topic: "user" })
        .listen(({ extra }) => spy(extra));
      const frame = JSON.stringify({ type: "user", payload: {} });

      getServer().send(frame);

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
      expect(spy.mock.calls[0][0].type).toBe("message");
      expect(spy.mock.calls[0][0].data).toBe(frame);
    });

    it("should ignore frames decoded to null", async () => {
      const socket = createSocket({ adapterOptions: { decode } });
      await waitForConnection(socket);
      const spy = vi.fn();
      const eventSpy = vi.fn();
      socket.events.onListenerEvent(eventSpy);
      socket.createListener()({ topic: "user" }).listen(spy);

      getServer().send(JSON.stringify({ type: "ping" }));
      getServer().send(JSON.stringify({ type: "user", payload: { name: "Alice" } }));

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
      expect(eventSpy).toHaveBeenCalledTimes(1);
    });

    it("should report decoder errors and keep the connection", async () => {
      const error = new Error("Malformed frame");
      const socket = createSocket({
        adapterOptions: {
          decode: (event) => {
            if (event.data === "broken") {
              throw error;
            }
            return decode(event);
          },
        },
      });
      await waitForConnection(socket);
      const errorSpy = vi.fn();
      const spy = vi.fn();
      socket.onError(errorSpy);
      socket.createListener()({ topic: "user" }).listen(spy);

      getServer().send("broken");
      getServer().send(JSON.stringify({ type: "user", payload: {} }));

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith({ error });
      expect(socket.adapter.connected).toBe(true);
    });

    it("should use the decoder returned by onConnect", async () => {
      // Registered synchronously - the initial connection attempt runs the interceptors asynchronously
      const socket = createSocket().onConnect(({ connection }) => ({
        ...connection,
        adapterOptions: { ...connection.adapterOptions, decode },
      }));
      await waitForConnection(socket);
      const spy = vi.fn();
      socket
        .createListener()({ topic: "user" })
        .listen(({ data }) => spy(data));

      getServer().send(JSON.stringify({ type: "user", payload: 1 }));

      await waitFor(() => {
        expect(spy).toHaveBeenCalledWith(1);
      });
    });
  });

  describe("When using custom encode", () => {
    it("should encode emitted messages", async () => {
      const socket = createSocket({ adapterOptions: { encode } });
      await waitForConnection(socket);

      socket
        .createEmitter<{ name: string }>()({ topic: "user" })
        .emit({ payload: { name: "Alice" } });

      await expect(getServer()).toReceiveMessage(JSON.stringify({ type: "user", payload: { name: "Alice" } }));
    });

    it("should encode heartbeat messages", async () => {
      const socket = createSocket({
        adapterOptions: {
          encode,
          heartbeat: true,
          heartbeatMessage: "ping",
          pingTimeout: 10,
          pongTimeout: 1000,
        },
      });
      await waitForConnection(socket);

      await expect(getServer()).toReceiveMessage(JSON.stringify({ type: "heartbeat", payload: "ping" }));
    });

    it("should report encoder errors without sending the frame", async () => {
      const error = new Error("Cannot encode");
      const socket = createSocket({
        adapterOptions: {
          encode: () => {
            throw error;
          },
        },
      });
      await waitForConnection(socket);
      const errorSpy = vi.fn();
      socket.onError(errorSpy);
      const sendSpy = vi.fn();
      getServer().on("message", sendSpy);

      await socket.adapter.emit(socket.createEmitter()({ topic: "user" }));

      expect(errorSpy).toHaveBeenCalledWith({ error });
      expect(sendSpy).not.toHaveBeenCalled();
    });
  });
});
