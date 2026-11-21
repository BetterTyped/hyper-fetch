import { createClient, createSdk } from "@hyper-fetch/core";
import type { ListenerModel, SSEAdapterOptionsType, SocketInstance } from "@hyper-fetch/sockets";
import { createSocketSdk, ServerSentEventsAdapter, Socket } from "@hyper-fetch/sockets";
import { EventSource } from "eventsource";

import type { HonoSchema } from "../../../src";
import type { FeedEvent, Price, RealtimeApp, RealtimeServer } from "../../utils/realtime-server";
import { createRealtimeServer } from "../../utils/realtime-server";

describe("Hono realtime [ Server-Sent Events ]", () => {
  let server: RealtimeServer;
  let sockets: SocketInstance[] = [];

  const createSocket = (adapterOptions?: SSEAdapterOptionsType, url = `${server.httpUrl}/events`) => {
    // Node has no global EventSource - the one from the `eventsource` package is passed to the adapter.
    // A short reconnect delay: a stream EventSource retries on its own is guarded by `connectionTimeout`.
    const socket = new Socket({
      url,
      adapter: ServerSentEventsAdapter,
      adapterOptions: { EventSource, ...adapterOptions },
      reconnectTime: 10,
    });
    sockets.push(socket);
    return socket;
  };

  /** Waits for the stream on both ends - the client opened it and the Hono route registered it */
  const waitForStream = (socket: SocketInstance, streams = 1) =>
    vi.waitFor(() => {
      expect(socket.adapter.connected).toBe(true);
      expect(server.state.sseClients.size).toBe(streams);
    });

  beforeEach(async () => {
    server = createRealtimeServer();
    await server.start();
  });

  afterEach(async () => {
    await Promise.all(sockets.map((socket) => socket.disconnect()));
    sockets = [];
    await server.stop();
  });

  describe("when listening by topic", () => {
    it("should deliver the events of the listened topic only", async () => {
      const socket = createSocket();
      const onFeed = vi.fn();
      const onOther = vi.fn();
      socket.createListener<FeedEvent>()({ topic: "feed" }).listen(onFeed);
      socket.createListener<FeedEvent>()({ topic: "other" }).listen(onOther);
      await waitForStream(socket);

      await server.publish({ topic: "feed", data: { id: 1, text: "first" } });

      await vi.waitFor(() => {
        expect(onFeed).toHaveBeenCalledTimes(1);
      });
      expect(onFeed.mock.calls[0][0].data).toStrictEqual({ id: 1, text: "first" });
      expect(onFeed.mock.calls[0][0].extra.lastEventId).toBe("1");
      expect(onOther).not.toHaveBeenCalled();
    });

    it("should match the topic params of the listener", async () => {
      const socket = createSocket();
      const onBtc = vi.fn();
      socket.createListener<Price>()({ topic: "prices/:symbol" }).setParams({ symbol: "BTC" }).listen(onBtc);
      await waitForStream(socket);

      // Events arrive in order, so the ETH event was already ignored when the BTC one arrives
      await server.publish({ topic: "prices/ETH", data: { symbol: "ETH", price: 10 } });
      await server.publish({ topic: "prices/BTC", data: { symbol: "BTC", price: 100 } });

      await vi.waitFor(() => {
        expect(onBtc).toHaveBeenCalledTimes(1);
      });
      expect(onBtc.mock.calls[0][0].data).toStrictEqual({ symbol: "BTC", price: 100 });
    });

    it("should read events that are not { topic, data } with a custom decoder", async () => {
      const socket = createSocket({
        decode: (event) => ({ topic: "ticks", data: JSON.parse(event.data) }),
      });
      const onTick = vi.fn();
      socket.createListener<Price>()({ topic: "ticks" }).listen(onTick);
      await waitForStream(socket);

      await server.publishRaw(JSON.stringify({ symbol: "BTC", price: 100 }));

      await vi.waitFor(() => {
        expect(onTick).toHaveBeenCalledTimes(1);
      });
      expect(onTick.mock.calls[0][0].data).toStrictEqual({ symbol: "BTC", price: 100 });
    });

    it("should report a decoder failure and keep the stream", async () => {
      const socket = createSocket({
        decode: (event) => {
          if (event.data === "not json") {
            throw new Error("Unexpected event");
          }
          return { topic: "ticks", data: JSON.parse(event.data) };
        },
      });
      const onTick = vi.fn();
      const onError = vi.fn();
      socket.onError(onError);
      socket.createListener<Price>()({ topic: "ticks" }).listen(onTick);
      await waitForStream(socket);

      await server.publishRaw("not json");
      await server.publishRaw(JSON.stringify({ symbol: "BTC", price: 100 }));

      await vi.waitFor(() => {
        expect(onTick).toHaveBeenCalledTimes(1);
      });
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0][0].error.message).toBe("Unexpected event");
      expect(socket.adapter.connected).toBe(true);
    });
  });

  describe("when the route writes named events", () => {
    it("should deliver a named event with JSON data to the listeners of the event name", async () => {
      const socket = createSocket();
      const onTick = vi.fn();
      const onStatus = vi.fn();
      socket.createListener<Price>()({ topic: "tick" }).listen(onTick);
      socket.createListener<string>()({ topic: "status" }).listen(onStatus);
      await waitForStream(socket);

      await server.publishNamed("tick", JSON.stringify({ symbol: "BTC", price: 100 }));

      await vi.waitFor(() => {
        expect(onTick).toHaveBeenCalledTimes(1);
      });
      expect(onTick.mock.calls[0][0].data).toStrictEqual({ symbol: "BTC", price: 100 });
      expect(onTick.mock.calls[0][0].extra.type).toBe("tick");
      expect(onStatus).not.toHaveBeenCalled();
    });

    it("should keep data that is not JSON as the raw text", async () => {
      const socket = createSocket();
      const onStatus = vi.fn();
      socket.createListener<string>()({ topic: "status" }).listen(onStatus);
      await waitForStream(socket);

      await server.publishNamed("status", "online");

      await vi.waitFor(() => {
        expect(onStatus).toHaveBeenCalledTimes(1);
      });
      expect(onStatus.mock.calls[0][0].data).toBe("online");
    });

    it("should deliver named and unnamed { topic, data } events side by side", async () => {
      const socket = createSocket();
      const onTick = vi.fn();
      socket.createListener<Price>()({ topic: "tick" }).listen(onTick);
      await waitForStream(socket);

      await server.publishNamed("tick", JSON.stringify({ symbol: "BTC", price: 1 }));
      await server.publish({ topic: "tick", data: { symbol: "BTC", price: 2 } });

      await vi.waitFor(() => {
        expect(onTick).toHaveBeenCalledTimes(2);
      });
      expect(onTick.mock.calls.map(([{ data }]) => data.price)).toStrictEqual([1, 2]);
    });

    it("should start receiving a named event for a listener added after the stream opened", async () => {
      const socket = createSocket();
      await waitForStream(socket);
      const onLate = vi.fn();

      socket.createListener<string>()({ topic: "late" }).listen(onLate);
      await server.publishNamed("late", "arrived");

      await vi.waitFor(() => {
        expect(onLate).toHaveBeenCalledTimes(1);
      });
      expect(onLate.mock.calls[0][0].data).toBe("arrived");
    });

    it("should stop receiving a named event after its last listener is removed", async () => {
      const socket = createSocket();
      const onStatus = vi.fn();
      const onTick = vi.fn();
      const removeStatus = socket.createListener<string>()({ topic: "status" }).listen(onStatus);
      socket.createListener<Price>()({ topic: "tick" }).listen(onTick);
      await waitForStream(socket);

      removeStatus();
      // Events arrive in order, so the status event was already skipped when the tick arrives
      await server.publishNamed("status", "offline");
      await server.publishNamed("tick", JSON.stringify({ symbol: "BTC", price: 100 }));

      await vi.waitFor(() => {
        expect(onTick).toHaveBeenCalledTimes(1);
      });
      expect(onStatus).not.toHaveBeenCalled();
    });

    it("should pass named events to a custom decoder with the event name as the type", async () => {
      const socket = createSocket({
        decode: (event) => ({ topic: event.type, data: { raw: String(event.data) } }),
      });
      const onStatus = vi.fn();
      socket.createListener<{ raw: string }>()({ topic: "status" }).listen(onStatus);
      await waitForStream(socket);

      await server.publishNamed("status", "online");

      await vi.waitFor(() => {
        expect(onStatus).toHaveBeenCalledTimes(1);
      });
      expect(onStatus.mock.calls[0][0].data).toStrictEqual({ raw: "online" });
    });

    it("should resume missed named events after the Hono route ends the stream", async () => {
      const socket = createSocket();
      const onTick = vi.fn();
      socket.createListener<Price>()({ topic: "tick" }).listen(onTick);
      await waitForStream(socket);
      await server.publishNamed("tick", JSON.stringify({ symbol: "BTC", price: 1 }));
      await vi.waitFor(() => {
        expect(onTick).toHaveBeenCalledTimes(1);
      });

      server.endEventStreams();
      await server.publishNamed("tick", JSON.stringify({ symbol: "BTC", price: 2 }));

      await vi.waitFor(() => {
        expect(onTick).toHaveBeenCalledTimes(2);
      });
      expect(onTick.mock.calls.map(([{ data }]) => data.price)).toStrictEqual([1, 2]);
      expect(server.state.sseLastEventIds).toStrictEqual([null, "1"]);
    });

    it("should listen to named events again on the new stream after a reconnect", async () => {
      const socket = createSocket();
      const onTick = vi.fn();
      socket.createListener<Price>()({ topic: "tick" }).listen(onTick);
      await waitForStream(socket);

      // A new EventSource - the named event handlers of the old one are gone with it
      await socket.reconnect();
      await waitForStream(socket);
      await server.publishNamed("tick", JSON.stringify({ symbol: "BTC", price: 100 }));

      await vi.waitFor(() => {
        expect(onTick).toHaveBeenCalledTimes(1);
      });
      expect(server.state.sseLastEventIds).toStrictEqual([null, null]);
    });
  });

  describe("when the stream drops", () => {
    it("should resume after the last event id when the Hono route ends the stream", async () => {
      const socket = createSocket();
      const onFeed = vi.fn();
      socket.createListener<FeedEvent>()({ topic: "feed" }).listen(onFeed);
      await waitForStream(socket);
      await server.publish({ topic: "feed", data: { id: 1, text: "one" } });
      await server.publish({ topic: "feed", data: { id: 2, text: "two" } });
      await vi.waitFor(() => {
        expect(onFeed).toHaveBeenCalledTimes(2);
      });

      server.endEventStreams();
      // Published while no stream is open - the reconnecting stream gets it as a missed event
      await server.publish({ topic: "feed", data: { id: 3, text: "three" } });

      await vi.waitFor(() => {
        expect(onFeed).toHaveBeenCalledTimes(3);
      });
      expect(onFeed.mock.calls.map(([{ data }]) => data.id)).toStrictEqual([1, 2, 3]);
      expect(server.state.sseLastEventIds).toStrictEqual([null, "2"]);
      expect(socket.adapter.connected).toBe(true);
    });

    it("should come back after the Hono server restarts", async () => {
      const socket = createSocket();
      const onFeed = vi.fn();
      const onDisconnected = vi.fn();
      socket.onDisconnected(onDisconnected);
      socket.createListener<FeedEvent>()({ topic: "feed" }).listen(onFeed);
      await waitForStream(socket);

      await server.stop();
      await vi.waitFor(() => {
        expect(onDisconnected).toHaveBeenCalledTimes(1);
      });
      await server.start();
      await waitForStream(socket);

      await server.publish({ topic: "feed", data: { id: 1, text: "back online" } });
      await vi.waitFor(() => {
        expect(onFeed).toHaveBeenCalledTimes(1);
      });
      expect(onFeed.mock.calls[0][0].data).toStrictEqual({ id: 1, text: "back online" });
    });
  });

  describe("when using the SDKs", () => {
    it("should take the stream path from the HTTP schema", async () => {
      const client = createClient({ url: server.httpUrl });
      const sdk = createSdk<typeof client, HonoSchema<RealtimeApp>>(client);
      const socket = createSocket({}, `${client.url}${sdk.events.$get.endpoint}`);

      await waitForStream(socket);

      expect(socket.url).toBe(`${server.httpUrl}/events`);
    });

    it("should listen through a typed socket SDK", async () => {
      type FeedSchema = {
        feed: { $listener: ListenerModel<{ response: FeedEvent; topic: "feed" }> };
        prices: { $symbol: { $listener: ListenerModel<{ response: Price; topic: "prices/:symbol" }> } };
      };
      const socket = createSocket();
      const sdk = createSocketSdk<typeof socket, FeedSchema>(socket);
      const onFeed = vi.fn();
      const onPrice = vi.fn();
      sdk.feed.$listener.listen(onFeed);
      sdk.prices.$symbol.$listener.setParams({ symbol: "BTC" }).listen(onPrice);
      await waitForStream(socket);

      await server.publish({ topic: "feed", data: { id: 1, text: "typed" } });
      await server.publish({ topic: "prices/BTC", data: { symbol: "BTC", price: 100 } });

      await vi.waitFor(() => {
        expect(onFeed).toHaveBeenCalledTimes(1);
        expect(onPrice).toHaveBeenCalledTimes(1);
      });
      expect(onFeed.mock.calls[0][0].data).toStrictEqual({ id: 1, text: "typed" });
      expect(onPrice.mock.calls[0][0].data).toStrictEqual({ symbol: "BTC", price: 100 });
    });
  });
});
