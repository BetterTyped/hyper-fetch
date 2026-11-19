import { EventSource as NodeEventSource } from "eventsource";
import { expectTypeOf } from "vitest";
import { WebSocket as NodeWebSocket } from "ws";

import type { ServerSentEventsAdapterType, SSEAdapterOptionsType } from "../../../src/adapter-sse";
import { ServerSentEventsAdapter } from "../../../src/adapter-sse";
import type { WebsocketAdapterOptionsType } from "../../../src/adapter-websockets";
import { Socket } from "../../../src/socket";

describe("Adapter implementation options [ Types ]", () => {
  it("should accept WebSocket classes from the environment and from ws", () => {
    expectTypeOf<{ webSocketImpl: typeof WebSocket }>().toMatchTypeOf<WebsocketAdapterOptionsType>();
    expectTypeOf<{ webSocketImpl: typeof NodeWebSocket }>().toMatchTypeOf<WebsocketAdapterOptionsType>();

    const socket = new Socket({ url: "ws://localhost", adapterOptions: { webSocketImpl: NodeWebSocket } });
    expectTypeOf(socket.adapter.adapterOptions?.webSocketImpl).not.toBeAny();
  });

  it("should accept EventSource classes from the environment and from eventsource", () => {
    expectTypeOf<{ eventSourceImpl: typeof EventSource }>().toMatchTypeOf<SSEAdapterOptionsType>();
    expectTypeOf<{ eventSourceImpl: typeof NodeEventSource }>().toMatchTypeOf<SSEAdapterOptionsType>();

    const socket = new Socket<ServerSentEventsAdapterType>({
      url: "http://localhost",
      adapter: ServerSentEventsAdapter(),
      adapterOptions: { eventSourceImpl: NodeEventSource },
    });
    expectTypeOf(socket.adapter.adapterOptions?.eventSourceImpl).not.toBeAny();
  });

  it("should reject values that are not classes", () => {
    // @ts-expect-error a WebSocket instance is not the class
    const instance: WebsocketAdapterOptionsType = { webSocketImpl: {} as WebSocket };
    // @ts-expect-error a factory function cannot be constructed
    const factory: WebsocketAdapterOptionsType = { webSocketImpl: (url: string) => url };
    // @ts-expect-error neither can a string
    const sse: SSEAdapterOptionsType = { eventSourceImpl: "EventSource" };

    expect([instance, factory, sse]).toHaveLength(3);
  });
});
