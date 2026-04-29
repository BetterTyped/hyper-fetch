import type { SocketInstance } from "socket";
import { Listener } from "listener";
import type { ListenerInstance } from "listener";
import { Emitter } from "emitter";
import type { EmitterInstance } from "emitter";
import { createSocketSdk } from "sdk";
import { createSocket } from "../../utils/socket.utils";

type TestSocket = SocketInstance;

type TestSchema = {
  chat: {
    messages: {
      $listener: ListenerInstance<{
        response: { text: string; user: string };
        topic: "chat/messages";
        socket: TestSocket;
      }>;
      $emitter: EmitterInstance<{
        payload: { text: string };
        topic: "chat/messages";
        socket: TestSocket;
      }>;
    };
    $roomId: {
      $listener: ListenerInstance<{
        response: { text: string; user: string };
        topic: "chat/:roomId";
        socket: TestSocket;
      }>;
    };
  };
  notifications: {
    $listener: ListenerInstance<{
      response: { message: string };
      topic: "notifications";
      socket: TestSocket;
    }>;
  };
};

describe("Socket SDK [ Base ]", () => {
  let socket: TestSocket;

  beforeEach(() => {
    socket = createSocket();
  });

  it("should create a socket SDK", () => {
    const sdk = createSocketSdk<TestSocket, TestSchema>(socket);
    expect(sdk).toBeDefined();
  });

  it("should create a listener from the SDK", () => {
    const sdk = createSocketSdk<TestSocket, TestSchema>(socket);
    const listener = sdk.chat.messages.$listener;
    expect(listener).toBeInstanceOf(Listener);
  });

  it("should create an emitter from the SDK", () => {
    const sdk = createSocketSdk<TestSocket, TestSchema>(socket);
    const emitter = sdk.chat.messages.$emitter;
    expect(emitter).toBeInstanceOf(Emitter);
  });

  it("should build correct topic for flat paths", () => {
    const sdk = createSocketSdk<TestSocket, TestSchema>(socket);
    const listener = sdk.notifications.$listener;
    expect(listener.topic).toBe("notifications");
  });

  it("should build correct topic for nested paths", () => {
    const sdk = createSocketSdk<TestSocket, TestSchema>(socket);
    const listener = sdk.chat.messages.$listener;
    expect(listener.topic).toBe("chat/messages");
  });

  it("should build correct topic with parameter segments", () => {
    const sdk = createSocketSdk<TestSocket, TestSchema>(socket);
    const listener = sdk.chat.$roomId.$listener;
    expect(listener.topic).toBe("chat/:roomId");
  });

  it("should allow setParams on a listener with params", () => {
    const sdk = createSocketSdk<TestSocket, TestSchema>(socket);
    const listener = sdk.chat.$roomId.$listener.setParams({ roomId: "abc" });
    expect(listener.topic).toBe("chat/abc");
  });

  it("should allow setPayload on an emitter", () => {
    const sdk = createSocketSdk<TestSocket, TestSchema>(socket);
    const emitter = sdk.chat.messages.$emitter.setPayload({ text: "hello" });
    expect(emitter.payload).toStrictEqual({ text: "hello" });
  });

  it("should return undefined for symbol keys", () => {
    const sdk = createSocketSdk<TestSocket, TestSchema>(socket);
    const sym = Symbol("test");
    expect((sdk as any)[sym]).toBeUndefined();
  });

  it("should return undefined for inspect key", () => {
    const sdk = createSocketSdk<TestSocket, TestSchema>(socket);
    expect((sdk as any).inspect).toBeUndefined();
  });

  it("should handle camelCase to kebab-case conversion", () => {
    type KebabSchema = {
      someChannel: {
        $listener: ListenerInstance<{
          response: any;
          topic: "some-channel";
          socket: TestSocket;
        }>;
      };
    };

    const sdk = createSocketSdk<TestSocket, KebabSchema>(socket, {
      camelCaseToKebabCase: true,
    });

    const listener = sdk.someChannel.$listener;
    expect(listener.topic).toBe("some-channel");
  });
});
