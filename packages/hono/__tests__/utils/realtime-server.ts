import { serve } from "@hono/node-server";
import type { ServerType } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import type { WSContext } from "hono/ws";
import type { AddressInfo } from "node:net";

export type ChatMessage = { roomId: string; text: string };
export type Notification = { userId: string; title: string };
export type Price = { symbol: string; price: number };
export type FeedEvent = { id: number; text: string };

/** `{ topic, data }` - the frame the WebsocketAdapter and the ServerSentEventsAdapter read and write by default */
type Frame = { topic: string; data: unknown };

const parseFrame = (raw: unknown): Frame | null => {
  if (typeof raw !== "string") {
    return null;
  }
  try {
    const frame: unknown = JSON.parse(raw);
    if (typeof frame === "object" && frame !== null && "topic" in frame && typeof frame.topic === "string") {
      return { topic: frame.topic, data: "data" in frame ? frame.data : undefined };
    }
  } catch {
    // Not JSON - the frame is ignored below
  }
  return null;
};

const readRoomId = (data: unknown): string | null => {
  if (typeof data === "object" && data !== null && "roomId" in data && typeof data.roomId === "string") {
    return data.roomId;
  }
  return null;
};

const readText = (data: unknown): string => {
  if (typeof data === "object" && data !== null && "text" in data && typeof data.text === "string") {
    return data.text;
  }
  return "";
};

const addTo = <K>(map: Map<K, Set<WSContext>>, key: K, ws: WSContext) => {
  const group = map.get(key) ?? new Set<WSContext>();
  group.add(ws);
  map.set(key, group);
};

const removeFrom = <K>(map: Map<K, Set<WSContext>>, key: K, ws: WSContext) => {
  const group = map.get(key);
  group?.delete(ws);
  if (group?.size === 0) {
    map.delete(key);
  }
};

type SseEvent = { id?: string; event?: string; data: string };
type SseClient = { send: (event: SseEvent) => Promise<void>; close: () => void };

/**
 * A Hono app with the realtime routes the tests run against, and the server-side state the tests assert on.
 * A factory, so every test starts with a fresh app and fresh state.
 */
export const createRealtimeApp = () => {
  const base = new Hono();
  const { upgradeWebSocket, injectWebSocket, wss } = createNodeWebSocket({ app: base });

  const state = {
    /** Open connections of the multiplexed `/ws` route */
    connections: new Set<WSContext>(),
    /** Room subscriptions of the `/ws` route - joined with a `rooms/join` message */
    rooms: new Map<string, Set<WSContext>>(),
    /** `rooms/join` minus `rooms/leave` messages per room - a join without its leave shows up here */
    joinBalance: new Map<string, number>(),
    /** Connections of the per-room `/chat/:roomId` route */
    roomConnections: new Map<string, Set<WSContext>>(),
    /** Connections of the `/notifications` route, by the `userId` query param */
    notificationConnections: new Map<string, Set<WSContext>>(),
    /** Connections of the `/legacy` route, which speaks `{ type, payload }` instead of `{ topic, data }` */
    legacyConnections: new Set<WSContext>(),
    /** Frames the `/legacy` route received */
    legacyFrames: [] as unknown[],
    /** Open `/events` streams */
    sseClients: new Set<SseClient>(),
    /** `Last-Event-ID` header of every `/events` connection, `null` for a fresh one */
    sseLastEventIds: [] as (string | null)[],
    /** Events published on `/events`, replayed after `Last-Event-ID` when a stream reconnects */
    sseLog: [] as (SseEvent & { id: string })[],
  };

  const app = base
    .get("/health", (c) => c.json({ ok: true }))
    // Multiplexed route: one connection, many rooms. Rooms are joined and left with messages.
    .get(
      "/ws",
      upgradeWebSocket(() => ({
        onOpen: (_event, ws) => {
          state.connections.add(ws);
        },
        onMessage: (event, ws) => {
          const frame = parseFrame(event.data);
          if (!frame) {
            return;
          }
          const roomId = readRoomId(frame.data);
          if (frame.topic === "rooms/join" && roomId) {
            addTo(state.rooms, roomId, ws);
            state.joinBalance.set(roomId, (state.joinBalance.get(roomId) ?? 0) + 1);
            ws.send(JSON.stringify({ topic: "rooms/joined", data: { roomId } }));
            return;
          }
          if (frame.topic === "rooms/leave" && roomId) {
            removeFrom(state.rooms, roomId, ws);
            state.joinBalance.set(roomId, (state.joinBalance.get(roomId) ?? 0) - 1);
            return;
          }
          if (frame.topic === "echo") {
            ws.send(JSON.stringify({ topic: "echo", data: frame.data }));
            return;
          }
          // `chat/<roomId>` - broadcast to everyone who joined the room
          const [scope, room] = frame.topic.split("/");
          if (scope === "chat" && room) {
            const message: ChatMessage = { roomId: room, text: readText(frame.data) };
            state.rooms.get(room)?.forEach((member) => {
              member.send(JSON.stringify({ topic: frame.topic, data: message }));
            });
          }
        },
        onClose: (_event, ws) => {
          state.connections.delete(ws);
          state.rooms.forEach((_members, roomId) => removeFrom(state.rooms, roomId, ws));
        },
      })),
    )
    // Per-room route: the connection itself is the subscription
    .get(
      "/chat/:roomId",
      upgradeWebSocket((c) => {
        // The upgrade callback gets an untyped context, so the param is `string | undefined` here
        const roomId = c.req.param("roomId") ?? "";
        return {
          onOpen: (_event, ws) => {
            addTo(state.roomConnections, roomId, ws);
          },
          onMessage: (event) => {
            const frame = parseFrame(event.data);
            if (frame?.topic !== "message") {
              return;
            }
            const message: ChatMessage = { roomId, text: readText(frame.data) };
            state.roomConnections.get(roomId)?.forEach((member) => {
              member.send(JSON.stringify({ topic: "message", data: message }));
            });
          },
          onClose: (_event, ws) => {
            removeFrom(state.roomConnections, roomId, ws);
          },
        };
      }),
    )
    // The subscription input travels in the query params of the handshake
    .get(
      "/notifications",
      upgradeWebSocket((c) => {
        const userId = c.req.query("userId") ?? "";
        return {
          onOpen: (_event, ws) => {
            addTo(state.notificationConnections, userId, ws);
          },
          onClose: (_event, ws) => {
            removeFrom(state.notificationConnections, userId, ws);
          },
        };
      }),
    )
    // An app with its own message shape - `{ type, payload }` - and plain-text pings
    .get(
      "/legacy",
      upgradeWebSocket(() => ({
        onOpen: (_event, ws) => {
          state.legacyConnections.add(ws);
        },
        onMessage: (event, ws) => {
          state.legacyFrames.push(typeof event.data === "string" ? JSON.parse(event.data) : event.data);
          ws.send("ping");
          ws.send(JSON.stringify({ type: "price", payload: { symbol: "BTC", price: 100 } }));
        },
        onClose: (_event, ws) => {
          state.legacyConnections.delete(ws);
        },
      })),
    )
    .get("/events", (c) =>
      streamSSE(c, async (stream) => {
        const lastEventId = c.req.header("last-event-id") ?? null;
        state.sseLastEventIds.push(lastEventId);

        // Tell EventSource to come back quickly after the stream ends
        await stream.write("retry: 10\n\n");
        const missed = lastEventId ? state.sseLog.filter(({ id }) => Number(id) > Number(lastEventId)) : [];
        // One after another - the order of the events is what the client resumes from
        await missed.reduce((written, event) => written.then(() => stream.writeSSE(event)), Promise.resolve());

        // The stream stays open until the client goes away or the test ends it
        let client: SseClient | undefined;
        await new Promise<void>((resolve) => {
          client = { send: (event) => stream.writeSSE(event), close: resolve };
          state.sseClients.add(client);
          stream.onAbort(resolve);
        });
        if (client) {
          state.sseClients.delete(client);
        }
      }),
    );

  /** Pushes `{ topic, data }` to every member of a `/ws` room */
  const broadcast = (roomId: string, text: string) => {
    const message: ChatMessage = { roomId, text };
    state.rooms.get(roomId)?.forEach((ws) => ws.send(JSON.stringify({ topic: `chat/${roomId}`, data: message })));
  };

  const notify = (notification: Notification) => {
    state.notificationConnections
      .get(notification.userId)
      ?.forEach((ws) => ws.send(JSON.stringify({ topic: "notification", data: notification })));
  };

  /** Writes an event on every open `/events` stream with the next id, so a reconnecting stream can resume after it */
  const writeLogged = async (event: SseEvent) => {
    const logged = { ...event, id: String(state.sseLog.length + 1) };
    state.sseLog.push(logged);
    await Promise.all([...state.sseClients].map((client) => client.send(logged)));
  };

  /** Publishes an unnamed `{ topic, data }` event on `/events` */
  const publish = (frame: Frame) => writeLogged({ data: JSON.stringify(frame) });

  /** Publishes a named event - `writeSSE({ event: name, data })` - with `data` written as it is */
  const publishNamed = (name: string, data: string) => writeLogged({ event: name, data });

  /** Sends `data` as it is - for apps whose events are not `{ topic, data }` */
  const publishRaw = async (data: string) => {
    await Promise.all([...state.sseClients].map((client) => client.send({ data })));
  };

  /** Ends every open `/events` stream - EventSource reconnects on its own with `Last-Event-ID` */
  const endEventStreams = () => {
    const clients = [...state.sseClients];
    state.sseClients.clear();
    clients.forEach((client) => client.close());
  };

  /** Closes every open `/ws` connection from the server side - `ws.close()` without a code sends 1005 */
  const closeConnections = (code?: number) => {
    state.connections.forEach((ws) => ws.close(code));
  };

  return {
    app,
    state,
    wss,
    injectWebSocket,
    broadcast,
    notify,
    publish,
    publishNamed,
    publishRaw,
    endEventStreams,
    closeConnections,
  };
};

/** The type the backend shares with the frontend */
export type RealtimeApp = ReturnType<typeof createRealtimeApp>["app"];

const HOST = "127.0.0.1";

/**
 * Runs the realtime app on a real Node server. `stop()` drops every connection like a crashed server would,
 * and `start()` afterwards listens on the same port again - a restart.
 */
export const createRealtimeServer = () => {
  const realtime = createRealtimeApp();
  let server: ServerType | undefined;
  let port = 0;

  const start = () =>
    new Promise<void>((resolve) => {
      // An explicit IPv4 host: with "localhost" the client may resolve ::1 and reach another process that got the
      // same port number on the other address family
      const instance = serve({ fetch: realtime.app.fetch, port, hostname: HOST }, () => {
        port = (instance.address() as AddressInfo).port;
        resolve();
      });
      realtime.injectWebSocket(instance);
      server = instance;
    });

  const stop = () =>
    new Promise<void>((resolve, reject) => {
      const instance = server;
      server = undefined;
      if (!instance) {
        resolve();
        return;
      }
      realtime.wss.clients.forEach((client) => client.terminate());
      realtime.endEventStreams();
      if ("closeAllConnections" in instance) {
        instance.closeAllConnections();
      }
      instance.close((error) => (error ? reject(error) : resolve()));
    });

  return {
    ...realtime,
    start,
    stop,
    get httpUrl() {
      return `http://${HOST}:${port}`;
    },
    get wsUrl() {
      return `ws://${HOST}:${port}`;
    },
  };
};

export type RealtimeServer = ReturnType<typeof createRealtimeServer>;
