import type { ServerSentEventsAdapterType } from "adapter-sse";
import { ServerSentEventsAdapter } from "adapter-sse";
import type { WebsocketAdapterType } from "adapter-websockets";
import type { EmitterInstance, EmitterModel } from "emitter";
import type { ListenerInstance, ListenerModel } from "listener";
import { Socket } from "socket";
import type {
  ExtractEmitterHasParamsType,
  ExtractEmitterHasPayloadType,
  ExtractEmitterPayloadType,
  ExtractEmitterTopicType,
  ExtractListenerResponseType,
  ExtractListenerTopicType,
  ExtractSocketAdapterType,
  ExtractSocketExtraType,
} from "types";
import { expectTypeOf } from "vitest";

type ChatMessage = { text: string; author: string };

const socket = new Socket({ url: "ws://types", adapterOptions: { autoConnect: false } });
const sseSocket = new Socket({
  url: "http://types",
  adapter: ServerSentEventsAdapter,
  adapterOptions: { autoConnect: false },
});

const emitter = socket.createEmitter<ChatMessage>()({ topic: "chat" });
const roomEmitter = socket.createEmitter<ChatMessage>()({ topic: "rooms/:roomId" });
const listener = socket.createListener<ChatMessage>()({ topic: "chat" });

describe("Socket [ TypeScript ]", () => {
  describe("When typing emitters", () => {
    it("should extract the payload and the topic", () => {
      expectTypeOf<ExtractEmitterPayloadType<typeof emitter>>().toEqualTypeOf<ChatMessage>();
      expectTypeOf<ExtractEmitterTopicType<typeof emitter>>().toEqualTypeOf<"chat">();
      expectTypeOf<ExtractEmitterTopicType<typeof roomEmitter>>().toEqualTypeOf<"rooms/:roomId">();
    });

    it("should track whether the payload and the params were set", () => {
      const withPayload = emitter.setPayload({ text: "hi", author: "me" });
      const withParams = roomEmitter.setParams({ roomId: 1 });

      expectTypeOf<ExtractEmitterHasPayloadType<typeof emitter>>().toEqualTypeOf<false>();
      expectTypeOf<ExtractEmitterHasPayloadType<typeof withPayload>>().toEqualTypeOf<true>();
      expectTypeOf<ExtractEmitterHasParamsType<typeof roomEmitter>>().toEqualTypeOf<false>();
      expectTypeOf<ExtractEmitterHasParamsType<typeof withParams>>().toEqualTypeOf<true>();
    });

    it("should require the payload in emit until it is set", () => {
      expectTypeOf(emitter.emit).toBeCallableWith({ payload: { text: "hi", author: "me" } });
      expectTypeOf(emitter.setPayload({ text: "hi", author: "me" }).emit).toBeCallableWith();
      // @ts-expect-error - payload is required
      expectTypeOf(emitter.emit).toBeCallableWith();
      // @ts-expect-error - payload misses a field
      expectTypeOf(emitter.emit).toBeCallableWith({ payload: { text: "hi" } });
    });

    it("should reject payloads of a wrong shape in setPayload", () => {
      expectTypeOf(emitter.setPayload).toBeCallableWith({ text: "hi", author: "me" });
      // @ts-expect-error - text must be a string
      emitter.setPayload({ text: 1, author: "me" });
    });

    it("should type the payload mapper input", () => {
      emitter.setPayloadMapper((payload) => {
        expectTypeOf(payload).toEqualTypeOf<ChatMessage>();
        return payload;
      });
    });

    it("should return nothing from emit", () => {
      expectTypeOf(emitter.emit).returns.toEqualTypeOf<void>();
    });

    it("should accept concrete emitters as instances and models", () => {
      expectTypeOf(emitter).toExtend<EmitterInstance>();
      expectTypeOf(emitter).toExtend<EmitterInstance<{ payload: ChatMessage }>>();
      expectTypeOf<EmitterModel<{ payload: ChatMessage; topic: "chat" }>["topic"]>().toEqualTypeOf<"chat">();
      expectTypeOf<ExtractEmitterPayloadType<EmitterModel<{ payload: ChatMessage }>>>().toEqualTypeOf<ChatMessage>();
      expectTypeOf<ExtractEmitterPayloadType<EmitterModel>>().toEqualTypeOf<undefined>();
    });
  });

  describe("When typing listeners", () => {
    it("should extract the response and the topic", () => {
      expectTypeOf<ExtractListenerResponseType<typeof listener>>().toEqualTypeOf<ChatMessage>();
      expectTypeOf<ExtractListenerTopicType<typeof listener>>().toEqualTypeOf<"chat">();
    });

    it("should type the callback data and return an unsubscribe function", () => {
      const stop = listener.listen(({ data }) => {
        expectTypeOf(data).toEqualTypeOf<ChatMessage>();
      });

      expectTypeOf(stop).toEqualTypeOf<() => void>();
      stop();
    });

    it("should accept concrete listeners as instances and models", () => {
      expectTypeOf(listener).toExtend<ListenerInstance>();
      expectTypeOf(listener).toExtend<ListenerInstance<{ response: { text: string } }>>();
      expectTypeOf<
        ExtractListenerResponseType<ListenerModel<{ response: ChatMessage }>>
      >().toEqualTypeOf<ChatMessage>();
      expectTypeOf<ExtractListenerResponseType<ListenerModel>>().toEqualTypeOf<unknown>();
    });
  });

  describe("When typing sockets", () => {
    it("should default to the WebSocket adapter", () => {
      expectTypeOf<ExtractSocketAdapterType<typeof socket>>().toEqualTypeOf<WebsocketAdapterType>();
      expectTypeOf<ExtractSocketExtraType<typeof socket>>().toEqualTypeOf<MessageEvent<any>>();
    });

    it("should follow the adapter passed to the socket", () => {
      expectTypeOf<ExtractSocketAdapterType<typeof sseSocket>>().toEqualTypeOf<ServerSentEventsAdapterType>();
    });

    it("should type the adapter options by the adapter", () => {
      expectTypeOf<NonNullable<typeof socket.options.adapterOptions>>().toHaveProperty("heartbeat");
      expectTypeOf<NonNullable<typeof sseSocket.options.adapterOptions>>().toHaveProperty("eventSourceInit");
      expectTypeOf<NonNullable<typeof sseSocket.options.adapterOptions>>().not.toHaveProperty("heartbeat");
      expectTypeOf<NonNullable<typeof socket.options.adapterOptions>>().not.toHaveProperty("eventSourceInit");
    });

    it("should type the connection passed to onConnect", () => {
      socket.onConnect(({ connection, attempt }) => {
        expectTypeOf(attempt).toEqualTypeOf<number>();
        expectTypeOf(connection.url).toEqualTypeOf<string>();
        expectTypeOf<NonNullable<typeof connection.adapterOptions>>().toHaveProperty("protocols");
        return connection;
      });
      // @ts-expect-error - the interceptor must return the connection
      socket.onConnect(() => null);
      socket.unstable_onConnectCallbacks = [];
    });

    it("should return promises from the connection methods", () => {
      expectTypeOf(socket.connect).returns.toEqualTypeOf<Promise<void>>();
      expectTypeOf(socket.disconnect).returns.toEqualTypeOf<Promise<void>>();
      expectTypeOf(socket.reconnect).returns.toEqualTypeOf<Promise<void>>();
    });

    it("should keep the socket type through the chained callbacks", () => {
      const chained = socket.onConnected(() => null).onDisconnected(() => null);

      expectTypeOf(chained).toEqualTypeOf(socket);
      socket.unstable_onConnectedCallbacks = [];
      socket.unstable_onDisconnectCallbacks = [];
    });
  });
});
