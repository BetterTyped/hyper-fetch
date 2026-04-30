import type { Emitter, EmitterInstance, EmitterModel } from "emitter";
import type { Listener, ListenerInstance, ListenerModel } from "listener";
import { createSocketSdk } from "sdk";
import type { InjectSocket } from "sdk";
import type { SocketInstance } from "socket";
import { describe, it, expect, expectTypeOf } from "vitest";

import { createSocket } from "../../utils/socket.utils";

/**
 * Type-only tests for the Socket SDK type surface.
 *
 * Each `it` block runs a static `expectTypeOf` assertion plus a trivial runtime placeholder
 * so the tests show up in the Vitest report.
 */

type TestSocket = SocketInstance;
type ChatMessage = { text: string; user: string };

describe("ListenerModel - defaults for omitted fields", () => {
  it("should default response to unknown", () => {
    type L = ListenerModel<{ topic: "chat/messages" }>;
    type Response = L extends Listener<infer R, any, any, any> ? R : never;
    expectTypeOf<Response>().toEqualTypeOf<unknown>();
    expect(true).toBe(true);
  });

  it("should default topic to string when not provided", () => {
    type L = ListenerModel<{ response: ChatMessage }>;
    type Topic = L extends Listener<any, infer T, any, any> ? T : never;
    expectTypeOf<Topic>().toEqualTypeOf<string>();
    expect(true).toBe(true);
  });

  it("should default socket to SocketInstance when not provided", () => {
    type L = ListenerModel<{ response: ChatMessage; topic: "chat" }>;
    type Sock = L extends Listener<any, any, infer S, any> ? S : never;
    expectTypeOf<Sock>().toEqualTypeOf<SocketInstance>();
    expect(true).toBe(true);
  });

  it("should default hasParams to false", () => {
    type L = ListenerModel<{ topic: "chat" }>;
    type HasParams = L extends Listener<any, any, any, infer Hp> ? Hp : never;
    expectTypeOf<HasParams>().toEqualTypeOf<false>();
    expect(true).toBe(true);
  });
});

describe("EmitterModel - defaults for omitted fields", () => {
  it("should default payload to undefined", () => {
    type E = EmitterModel<{ topic: "chat" }>;
    type Payload = E extends Emitter<infer P, any, any, any, any> ? P : never;
    expectTypeOf<Payload>().toEqualTypeOf<undefined>();
    expect(true).toBe(true);
  });

  it("should default topic to string when not provided", () => {
    type E = EmitterModel<{ payload: { text: string } }>;
    type Topic = E extends Emitter<any, infer T, any, any, any> ? T : never;
    expectTypeOf<Topic>().toEqualTypeOf<string>();
    expect(true).toBe(true);
  });

  it("should default socket to SocketInstance when not provided", () => {
    type E = EmitterModel<{ topic: "chat" }>;
    type Sock = E extends Emitter<any, any, infer S, any, any> ? S : never;
    expectTypeOf<Sock>().toEqualTypeOf<SocketInstance>();
    expect(true).toBe(true);
  });

  it("should default hasPayload and hasParams to false", () => {
    type E = EmitterModel<{ topic: "chat" }>;
    type HasPayload = E extends Emitter<any, any, any, infer Hp, any> ? Hp : never;
    type HasParams = E extends Emitter<any, any, any, any, infer Hpa> ? Hpa : never;
    expectTypeOf<HasPayload>().toEqualTypeOf<false>();
    expectTypeOf<HasParams>().toEqualTypeOf<false>();
    expect(true).toBe(true);
  });
});

describe("ListenerModel / EmitterModel - user-provided fields override defaults", () => {
  it("should narrow response and topic on a Listener when provided", () => {
    type L = ListenerModel<{ response: ChatMessage; topic: "chat/messages" }>;
    type Response = L extends Listener<infer R, any, any, any> ? R : never;
    type Topic = L extends Listener<any, infer T, any, any> ? T : never;
    expectTypeOf<Response>().toEqualTypeOf<ChatMessage>();
    expectTypeOf<Topic>().toEqualTypeOf<"chat/messages">();
    expect(true).toBe(true);
  });

  it("should narrow payload and topic on an Emitter when provided", () => {
    type E = EmitterModel<{ payload: { text: string }; topic: "chat/send" }>;
    type Payload = E extends Emitter<infer P, any, any, any, any> ? P : never;
    type Topic = E extends Emitter<any, infer T, any, any, any> ? T : never;
    expectTypeOf<Payload>().toEqualTypeOf<{ text: string }>();
    expectTypeOf<Topic>().toEqualTypeOf<"chat/send">();
    expect(true).toBe(true);
  });
});

describe("ListenerInstance / EmitterInstance - keep `any` defaults (constraint use)", () => {
  it("should keep ListenerInstance wide so concrete listeners satisfy it", () => {
    type LI = ListenerInstance;
    type Response = LI extends Listener<infer R, any, any, any> ? R : never;
    expectTypeOf<Response>().toEqualTypeOf<any>();
    expect(true).toBe(true);
  });

  it("should accept a concrete ListenerModel as a ListenerInstance", () => {
    type Concrete = ListenerModel<{ response: ChatMessage; topic: "chat" }>;
    expectTypeOf<Concrete>().toMatchTypeOf<ListenerInstance>();
    expect(true).toBe(true);
  });

  it("should accept a concrete EmitterModel as an EmitterInstance", () => {
    type Concrete = EmitterModel<{ payload: { text: string }; topic: "chat" }>;
    expectTypeOf<Concrete>().toMatchTypeOf<EmitterInstance>();
    expect(true).toBe(true);
  });
});

describe("InjectSocket - schema-level socket injection", () => {
  it("should replace the Socket slot on a Listener leaf", () => {
    type Schema = {
      $listener: ListenerModel<{ response: ChatMessage; topic: "chat" }>;
    };
    type Injected = InjectSocket<Schema, TestSocket>;
    type ResolvedSocket = Injected["$listener"] extends Listener<any, any, infer S, any> ? S : never;
    expectTypeOf<ResolvedSocket>().toEqualTypeOf<TestSocket>();
    expect(true).toBe(true);
  });

  it("should replace the Socket slot on an Emitter leaf", () => {
    type Schema = {
      $emitter: EmitterModel<{ payload: { text: string }; topic: "chat" }>;
    };
    type Injected = InjectSocket<Schema, TestSocket>;
    type ResolvedSocket = Injected["$emitter"] extends Emitter<any, any, infer S, any, any> ? S : never;
    expectTypeOf<ResolvedSocket>().toEqualTypeOf<TestSocket>();
    expect(true).toBe(true);
  });

  it("should walk nested schema objects and inject into every leaf", () => {
    type Schema = {
      chat: {
        messages: {
          $listener: ListenerModel<{ response: ChatMessage; topic: "chat/messages" }>;
          $emitter: EmitterModel<{ payload: { text: string }; topic: "chat/messages" }>;
        };
        $roomId: {
          $listener: ListenerModel<{ response: ChatMessage; topic: "chat/:roomId" }>;
        };
      };
    };
    type Injected = InjectSocket<Schema, TestSocket>;

    type LSocket = Injected["chat"]["messages"]["$listener"] extends Listener<any, any, infer S, any> ? S : never;
    type ESocket = Injected["chat"]["messages"]["$emitter"] extends Emitter<any, any, infer S, any, any> ? S : never;
    type NestedLSocket = Injected["chat"]["$roomId"]["$listener"] extends Listener<any, any, infer S, any> ? S : never;

    expectTypeOf<LSocket>().toEqualTypeOf<TestSocket>();
    expectTypeOf<ESocket>().toEqualTypeOf<TestSocket>();
    expectTypeOf<NestedLSocket>().toEqualTypeOf<TestSocket>();
    expect(true).toBe(true);
  });

  it("should preserve response, payload, topic on injected leaves", () => {
    type Schema = {
      chat: {
        $listener: ListenerModel<{ response: ChatMessage; topic: "chat/messages" }>;
        $emitter: EmitterModel<{ payload: { text: string }; topic: "chat/messages" }>;
      };
    };
    type Injected = InjectSocket<Schema, TestSocket>;

    type LResp = Injected["chat"]["$listener"] extends Listener<infer R, any, any, any> ? R : never;
    type LTopic = Injected["chat"]["$listener"] extends Listener<any, infer T, any, any> ? T : never;
    type EPayload = Injected["chat"]["$emitter"] extends Emitter<infer P, any, any, any, any> ? P : never;
    type ETopic = Injected["chat"]["$emitter"] extends Emitter<any, infer T, any, any, any> ? T : never;

    expectTypeOf<LResp>().toEqualTypeOf<ChatMessage>();
    expectTypeOf<LTopic>().toEqualTypeOf<"chat/messages">();
    expectTypeOf<EPayload>().toEqualTypeOf<{ text: string }>();
    expectTypeOf<ETopic>().toEqualTypeOf<"chat/messages">();
    expect(true).toBe(true);
  });
});

describe("createSocketSdk - produces a fully resolved SDK type", () => {
  type Schema = {
    chat: {
      messages: {
        $listener: ListenerModel<{ response: ChatMessage; topic: "chat/messages" }>;
        $emitter: EmitterModel<{ payload: { text: string }; topic: "chat/messages" }>;
      };
      $roomId: {
        $listener: ListenerModel<{ response: ChatMessage; topic: "chat/:roomId" }>;
      };
    };
  };

  it("should type sdk.chat.messages.$listener with the SDK socket injected", () => {
    const socket = createSocket();
    const sdk = createSocketSdk<typeof socket, Schema>(socket);

    type ChatListener = typeof sdk.chat.messages.$listener;
    type ResolvedSocket = ChatListener extends Listener<any, any, infer S, any> ? S : never;
    type ResolvedResponse = ChatListener extends Listener<infer R, any, any, any> ? R : never;
    type ResolvedTopic = ChatListener extends Listener<any, infer T, any, any> ? T : never;

    expectTypeOf<ResolvedSocket>().toEqualTypeOf<typeof socket>();
    expectTypeOf<ResolvedResponse>().toEqualTypeOf<ChatMessage>();
    expectTypeOf<ResolvedTopic>().toEqualTypeOf<"chat/messages">();
    expect(true).toBe(true);
  });

  it("should type sdk.chat.messages.$emitter with the SDK socket injected", () => {
    const socket = createSocket();
    const sdk = createSocketSdk<typeof socket, Schema>(socket);

    type ChatEmitter = typeof sdk.chat.messages.$emitter;
    type ResolvedSocket = ChatEmitter extends Emitter<any, any, infer S, any, any> ? S : never;
    type ResolvedPayload = ChatEmitter extends Emitter<infer P, any, any, any, any> ? P : never;

    expectTypeOf<ResolvedSocket>().toEqualTypeOf<typeof socket>();
    expectTypeOf<ResolvedPayload>().toEqualTypeOf<{ text: string }>();
    expect(true).toBe(true);
  });

  it("should type nested sdk.chat.$roomId.$listener with the SDK socket injected", () => {
    const socket = createSocket();
    const sdk = createSocketSdk<typeof socket, Schema>(socket);

    type RoomListener = typeof sdk.chat.$roomId.$listener;
    type ResolvedSocket = RoomListener extends Listener<any, any, infer S, any> ? S : never;
    type ResolvedTopic = RoomListener extends Listener<any, infer T, any, any> ? T : never;

    expectTypeOf<ResolvedSocket>().toEqualTypeOf<typeof socket>();
    expectTypeOf<ResolvedTopic>().toEqualTypeOf<"chat/:roomId">();
    expect(true).toBe(true);
  });

  it("should expose $configure on the Socket SDK type", () => {
    const socket = createSocket();
    const sdk = createSocketSdk<typeof socket, Schema>(socket);

    expectTypeOf(sdk.$configure).toBeFunction();
    expect(true).toBe(true);
  });
});

describe("$configure - dot-path callback narrowing", () => {
  type Schema = {
    chat: {
      messages: {
        $listener: ListenerModel<{ response: ChatMessage; topic: "chat/messages" }>;
        $emitter: EmitterModel<{ payload: { text: string }; topic: "chat/messages" }>;
      };
    };
  };

  it("should accept a function value for a dot-path listener key", () => {
    const socket = createSocket();
    const sdk = createSocketSdk<typeof socket, Schema>(socket);

    sdk.$configure({
      "chat.messages.$listener": (instance) => {
        expectTypeOf(instance).toMatchTypeOf<ListenerInstance>();
        return instance;
      },
    });

    expect(true).toBe(true);
  });

  it("should accept a function value for a dot-path emitter key", () => {
    const socket = createSocket();
    const sdk = createSocketSdk<typeof socket, Schema>(socket);

    sdk.$configure({
      "chat.messages.$emitter": (instance) => {
        expectTypeOf(instance).toMatchTypeOf<EmitterInstance>();
        return instance;
      },
    });

    expect(true).toBe(true);
  });

  it("should accept a plain-object value for global wildcard and topic-group keys", () => {
    const socket = createSocket();
    const sdk = createSocketSdk<typeof socket, Schema>(socket);

    sdk.$configure({
      "*": { options: { reconnect: true } },
      "chat/*": { options: { priority: "high" } },
      "chat/messages": { options: { buffered: true } },
    });

    expect(true).toBe(true);
  });
});
