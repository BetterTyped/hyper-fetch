import { createNodeWebSocket } from "@hono/node-ws";
import type { EmitterModel, ListenerModel } from "@hyper-fetch/sockets";
import { createSocketSdk, Socket } from "@hyper-fetch/sockets";
import { Hono } from "hono";
import { defineWebSocketHelper } from "hono/ws";
import { expectTypeOf } from "vitest";

import type { HonoAppToHyperFetch, HonoWebSocketPath } from "../../../src";
import type { ChatMessage, RealtimeApp } from "../../utils/realtime-server";

describe("HonoWebSocketPath [ Types ]", () => {
  it("should list the WebSocket routes of the app", () => {
    expectTypeOf<HonoWebSocketPath<RealtimeApp>>().toEqualTypeOf<
      "/ws" | `/chat/${string}` | "/notifications" | "/legacy"
    >();
    expect(true).toBe(true);
  });

  it("should accept a path with the params filled in", () => {
    const roomId = "42";
    const path: HonoWebSocketPath<RealtimeApp> = `/chat/${roomId}`;

    expectTypeOf(path).toExtend<HonoWebSocketPath<RealtimeApp>>();
    expect(path).toBe("/chat/42");
  });

  it("should reject HTTP routes and paths the app does not define", () => {
    // @ts-expect-error - /health is an HTTP route
    const http: HonoWebSocketPath<RealtimeApp> = "/health";
    // @ts-expect-error - /events is a Server-Sent Events route, not a WebSocket
    const sse: HonoWebSocketPath<RealtimeApp> = "/events";
    // @ts-expect-error - the app has no /rooms route
    const typo: HonoWebSocketPath<RealtimeApp> = "/rooms/1";

    expect([http, sse, typo]).toHaveLength(3);
  });

  it("should prefix the paths with basePath and app.route", () => {
    const { upgradeWebSocket } = createNodeWebSocket({ app: new Hono() });
    const live = new Hono().get(
      "/rooms/:roomId/:userId",
      upgradeWebSocket(() => ({})),
    );
    const api = new Hono().basePath("/api").route("/live", live);

    expectTypeOf<HonoWebSocketPath<typeof api>>().toEqualTypeOf<`/api/live/rooms/${string}/${string}`>();
    expect(true).toBe(true);
  });

  it("should find routes of any runtime helper built on Hono's defineWebSocketHelper", () => {
    // hono/bun, hono/deno and hono/cloudflare-workers export the same UpgradeWebSocket type
    const upgradeWebSocket = defineWebSocketHelper(() => new Response());
    const live = new Hono().get(
      "/live",
      upgradeWebSocket(() => ({})),
    );

    expectTypeOf<HonoWebSocketPath<typeof live>>().toEqualTypeOf<"/live">();
    expect(true).toBe(true);
  });

  it("should expand optional params and drop regex patterns like the HTTP schema", () => {
    const upgradeWebSocket = defineWebSocketHelper(() => new Response());
    const live = new Hono()
      .get(
        "/feeds/:feedId?",
        upgradeWebSocket(() => ({})),
      )
      .get(
        "/posts/:id{[0-9]+}/live",
        upgradeWebSocket(() => ({})),
      );

    expectTypeOf<HonoWebSocketPath<typeof live>>().toEqualTypeOf<
      "/feeds" | `/feeds/${string}` | `/posts/${string}/live`
    >();
    expect(true).toBe(true);
  });

  it("should leave a WebSocket route out of the HTTP schema but keep the other methods of its path", () => {
    const upgradeWebSocket = defineWebSocketHelper(() => new Response());
    const app = new Hono()
      .get(
        "/chat",
        upgradeWebSocket(() => ({})),
      )
      .post("/chat", (c) => c.json({ sent: true }));

    type Schema = HonoAppToHyperFetch<typeof app>;
    expectTypeOf<keyof Schema["chat"]>().toEqualTypeOf<"$post">();
    expect(true).toBe(true);
  });

  it("should resolve to never for an app without WebSocket routes and for anything that is not an app", () => {
    const http = new Hono().get("/users", (c) => c.json([]));

    expectTypeOf<HonoWebSocketPath<typeof http>>().toBeNever();
    expectTypeOf<HonoWebSocketPath<{ routes: [] }>>().toBeNever();
    expect(true).toBe(true);
  });
});

describe("Hono realtime [ createSocketSdk schema ]", () => {
  type ChatSchema = {
    chat: {
      $roomId: {
        $listener: ListenerModel<{ response: ChatMessage; topic: "chat/:roomId" }>;
        $emitter: EmitterModel<{ payload: { text: string }; topic: "chat/:roomId" }>;
      };
    };
    rooms: {
      join: { $emitter: EmitterModel<{ payload: { roomId: string }; topic: "rooms/join" }> };
    };
  };

  const socket = new Socket({ url: "ws://localhost/ws", adapterOptions: { autoConnect: false } });
  const sdk = createSocketSdk<typeof socket, ChatSchema>(socket);

  it("should type the listener response and the topic params", () => {
    const listener = sdk.chat.$roomId.$listener.setParams({ roomId: "1" });

    listener.listen(({ data }) => {
      expectTypeOf(data).toEqualTypeOf<ChatMessage>();
    });
    // @ts-expect-error - the topic names the param roomId
    sdk.chat.$roomId.$listener.setParams({ id: "1" });

    expect(listener.topic).toBe("chat/1");
  });

  it("should type the emitter payload", () => {
    const emitter = sdk.rooms.join.$emitter;

    expectTypeOf(emitter.emit).parameter(0).toHaveProperty("payload").toEqualTypeOf<{ roomId: string }>();
    // @ts-expect-error - rooms/join takes the room id
    emitter.setPayload({ room: "1" });

    expect(emitter.topic).toBe("rooms/join");
  });
});
