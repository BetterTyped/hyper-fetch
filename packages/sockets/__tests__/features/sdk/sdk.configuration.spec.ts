import type { EmitterModel } from "emitter";
import type { ListenerModel } from "listener";
import type { SocketSdkConfigurationValue } from "sdk";
import { createSocketSdk, createSocketConfiguration } from "sdk";
import type { SocketInstance } from "socket";

import { createSocket } from "../../utils/socket.utils";

type TestSocket = SocketInstance;

// Schema does not need to declare `socket` per leaf - the SDK injects it from createSocketSdk(socket).
type TestSchema = {
  chat: {
    messages: {
      $listener: ListenerModel<{
        response: { text: string; user: string };
        topic: "chat/messages";
      }>;
      $emitter: EmitterModel<{
        payload: { text: string };
        topic: "chat/messages";
      }>;
    };
    rooms: {
      $listener: ListenerModel<{
        response: { name: string };
        topic: "chat/rooms";
      }>;
    };
  };
  notifications: {
    $listener: ListenerModel<{
      response: { message: string };
      topic: "notifications";
    }>;
  };
};

describe("Socket SDK [ Configuration ]", () => {
  let socket: TestSocket;

  beforeEach(() => {
    socket = createSocket();
  });

  describe("createSocketConfiguration", () => {
    it("should create a typed configuration map with function values", () => {
      const config = createSocketConfiguration<TestSchema>()({
        "*": (instance) => instance,
      });

      expect(config).toBeDefined();
      expect(typeof config["*"]).toBe("function");
    });

    it("should create a typed configuration map with plain object values", () => {
      const config = createSocketConfiguration<TestSchema>()({
        "*": { options: { shared: true } },
      });

      expect(config).toBeDefined();
      expect(config["*"]).toStrictEqual({ options: { shared: true } });
    });
  });

  describe("plain object shorthand", () => {
    it("should apply options via plain object to all instances", () => {
      const sdk = createSocketSdk<TestSocket, TestSchema>(socket);
      const configured = sdk.$configure({
        "*": { options: { reconnect: true } },
      });

      const listener = configured.chat.messages.$listener;
      expect(listener.options).toStrictEqual({ reconnect: true });

      const emitter = configured.chat.messages.$emitter;
      expect(emitter.options).toStrictEqual({ reconnect: true });

      const notifListener = configured.notifications.$listener;
      expect(notifListener.options).toStrictEqual({ reconnect: true });
    });

    it("should apply options via plain object on topic group key", () => {
      const sdk = createSocketSdk<TestSocket, TestSchema>(socket);
      const configured = sdk.$configure({
        "chat/messages": { options: { chatOnly: true } },
      });

      const chatListener = configured.chat.messages.$listener;
      expect(chatListener.options).toStrictEqual({ chatOnly: true });

      const notifListener = configured.notifications.$listener;
      expect(notifListener.options).toBeUndefined();
    });

    it("should apply options via plain object on dot-path key", () => {
      const sdk = createSocketSdk<TestSocket, TestSchema>(socket);
      const configured = sdk.$configure({
        "chat.messages.$listener": { options: { listenerOnly: true } },
      });

      const chatListener = configured.chat.messages.$listener;
      expect(chatListener.options).toStrictEqual({ listenerOnly: true });

      const chatEmitter = configured.chat.messages.$emitter;
      expect(chatEmitter.options).toBeUndefined();
    });
  });

  describe("topic group matching", () => {
    it("should apply config to an exact topic", () => {
      const sdk = createSocketSdk<TestSocket, TestSchema>(socket);
      const setOpts: SocketSdkConfigurationValue = (instance) => instance.setOptions({ exact: true });
      const configured = sdk.$configure({
        "chat/messages": setOpts,
      });

      const chatListener = configured.chat.messages.$listener;
      expect(chatListener.options).toStrictEqual({ exact: true });

      const chatEmitter = configured.chat.messages.$emitter;
      expect(chatEmitter.options).toStrictEqual({ exact: true });

      const roomsListener = configured.chat.rooms.$listener;
      expect(roomsListener.options).toBeUndefined();

      const notifListener = configured.notifications.$listener;
      expect(notifListener.options).toBeUndefined();
    });

    it("should apply config to wildcard topic pattern", () => {
      const sdk = createSocketSdk<TestSocket, TestSchema>(socket);
      const setOpts: SocketSdkConfigurationValue = (instance) => instance.setOptions({ chatWild: true });
      const configured = sdk.$configure({
        "chat/*": setOpts,
      });

      const chatMsgListener = configured.chat.messages.$listener;
      expect(chatMsgListener.options).toStrictEqual({ chatWild: true });

      const chatRoomListener = configured.chat.rooms.$listener;
      expect(chatRoomListener.options).toStrictEqual({ chatWild: true });

      const notifListener = configured.notifications.$listener;
      expect(notifListener.options).toBeUndefined();
    });

    it("should apply wildcard with plain object values", () => {
      const sdk = createSocketSdk<TestSocket, TestSchema>(socket);
      const configured = sdk.$configure({
        "chat/*": { options: { allChat: true } },
      });

      const chatMsgListener = configured.chat.messages.$listener;
      expect(chatMsgListener.options).toStrictEqual({ allChat: true });

      const chatEmitter = configured.chat.messages.$emitter;
      expect(chatEmitter.options).toStrictEqual({ allChat: true });

      const notifListener = configured.notifications.$listener;
      expect(notifListener.options).toBeUndefined();
    });

    it("should not match partial topic prefixes without wildcard", () => {
      const sdk = createSocketSdk<TestSocket, TestSchema>(socket);
      const setOpts: SocketSdkConfigurationValue = (instance) => instance.setOptions({ noMatch: true });
      const configured = sdk.$configure({
        notifications: setOpts,
      });

      const chatMsgListener = configured.chat.messages.$listener;
      expect(chatMsgListener.options).toBeUndefined();

      const notifListener = configured.notifications.$listener;
      expect(notifListener.options).toStrictEqual({ noMatch: true });
    });
  });

  describe("function-based configuration", () => {
    it("should apply global function defaults to all instances", () => {
      const sdk = createSocketSdk<TestSocket, TestSchema>(socket);
      const setCustom: SocketSdkConfigurationValue = (instance) => instance.setOptions({ custom: true });
      const configured = sdk.$configure({
        "*": setCustom,
      });

      expect(configured.chat.messages.$listener.options).toStrictEqual({ custom: true });
      expect(configured.notifications.$listener.options).toStrictEqual({ custom: true });
    });

    it("should apply dot-path function to a specific listener", () => {
      const sdk = createSocketSdk<TestSocket, TestSchema>(socket);
      const configured = sdk.$configure({
        "chat.messages.$listener": (instance) => instance.setOptions({ chatOnly: true }),
      });

      expect(configured.chat.messages.$listener.options).toStrictEqual({ chatOnly: true });
      expect(configured.notifications.$listener.options).toBeUndefined();
    });

    it("should apply dot-path function to a specific emitter with narrowed type", () => {
      const mapper = (payload: { text: string }) => ({ ...payload, transformed: true });
      const sdk = createSocketSdk<TestSocket, TestSchema>(socket);
      const configured = sdk.$configure({
        "chat.messages.$emitter": (instance) => instance.setPayloadMapper(mapper),
      });

      expect(configured.chat.messages.$emitter.unstable_payloadMapper).toBe(mapper);
    });
  });

  describe("3-level application order", () => {
    it("should apply in order: global -> topic group -> dot-path", () => {
      const sdk = createSocketSdk<TestSocket, TestSchema>(socket);
      const configured = sdk.$configure({
        "chat.messages.$listener": { options: { level: "dot-path" } },
        "*": { options: { level: "global" } },
        "chat/messages": { options: { level: "topic-group" } },
      });

      const chatListener = configured.chat.messages.$listener;
      expect(chatListener.options).toStrictEqual({ level: "dot-path" });
    });

    it("should apply topic group after global", () => {
      const sdk = createSocketSdk<TestSocket, TestSchema>(socket);
      const configured = sdk.$configure({
        "chat/messages": { options: { level: "topic-group" } },
        "*": { options: { level: "global" } },
      });

      const chatListener = configured.chat.messages.$listener;
      expect(chatListener.options).toStrictEqual({ level: "topic-group" });

      const notifListener = configured.notifications.$listener;
      expect(notifListener.options).toStrictEqual({ level: "global" });
    });

    it("should apply dot-path after topic group", () => {
      const sdk = createSocketSdk<TestSocket, TestSchema>(socket);
      const configured = sdk.$configure({
        "chat.messages.$listener": { options: { level: "dot-path" } },
        "chat/messages": { options: { level: "topic-group" } },
      });

      const chatListener = configured.chat.messages.$listener;
      expect(chatListener.options).toStrictEqual({ level: "dot-path" });

      const chatEmitter = configured.chat.messages.$emitter;
      expect(chatEmitter.options).toStrictEqual({ level: "topic-group" });
    });
  });

  describe("configuration stacking", () => {
    it("should stack properties from global and dot-path configs", () => {
      const sdk = createSocketSdk<TestSocket, TestSchema>(socket);
      const mapper = (payload: { text: string }) => ({ ...payload, transformed: true });
      const configured = sdk.$configure({
        "*": { options: { shared: true } },
        "chat.messages.$emitter": (instance) => instance.setPayloadMapper(mapper),
      });

      const emitter = configured.chat.messages.$emitter;
      expect(emitter.options).toStrictEqual({ shared: true });
      expect(emitter.unstable_payloadMapper).toBe(mapper);
    });

    it("should stack properties across all 3 levels", () => {
      const sdk = createSocketSdk<TestSocket, TestSchema>(socket);
      const mapper = (payload: { text: string }) => ({ ...payload, transformed: true });
      const configured = sdk.$configure({
        "*": ((instance) => instance.setOptions({ global: true })) as SocketSdkConfigurationValue,
        "chat/*": ((instance) =>
          instance.setOptions({ ...instance.options, chatGroup: true })) as SocketSdkConfigurationValue,
        "chat.messages.$emitter": (instance) => instance.setPayloadMapper(mapper),
      });

      const emitter = configured.chat.messages.$emitter;
      expect(emitter.options).toStrictEqual({ global: true, chatGroup: true });
      expect(emitter.unstable_payloadMapper).toBe(mapper);
    });

    it("should let a later level override a specific property while keeping others", () => {
      const sdk = createSocketSdk<TestSocket, TestSchema>(socket);
      const configured = sdk.$configure({
        "*": ((instance) => instance.setOptions({ fromGlobal: true })) as SocketSdkConfigurationValue,
        "chat.messages.$listener": (instance) => instance.setOptions({ fromSpecific: true }),
      });

      const chatListener = configured.chat.messages.$listener;
      expect(chatListener.options).toStrictEqual({ fromSpecific: true });

      const notifListener = configured.notifications.$listener;
      expect(notifListener.options).toStrictEqual({ fromGlobal: true });
    });
  });

  describe("mixed plain-object and function values", () => {
    it("should apply both value types in the same configuration", () => {
      const sdk = createSocketSdk<TestSocket, TestSchema>(socket);
      const mapper = (payload: { text: string }) => ({ ...payload, transformed: true });
      const configured = sdk.$configure({
        "*": { options: { shared: true } },
        "chat.messages.$emitter": (instance) => instance.setPayloadMapper(mapper),
      });

      const emitter = configured.chat.messages.$emitter;
      expect(emitter.options).toStrictEqual({ shared: true });
      expect(emitter.unstable_payloadMapper).toBe(mapper);
    });
  });

  describe("immutability", () => {
    it("should return a new SDK instance from $configure", () => {
      const setOpts: SocketSdkConfigurationValue = (instance) => instance.setOptions({ test: true });
      const sdk = createSocketSdk<TestSocket, TestSchema>(socket);
      const configured = sdk.$configure({ "*": setOpts });

      expect(sdk.chat.messages.$listener.options).toBeUndefined();
      expect(configured.chat.messages.$listener.options).toStrictEqual({ test: true });
    });

    it("should merge existing defaults with new $configure call", () => {
      const setFromInit: SocketSdkConfigurationValue = (instance) => instance.setOptions({ fromInit: true });
      const sdk = createSocketSdk<TestSocket, TestSchema>(socket, {
        defaults: {
          "*": setFromInit,
        },
      });

      const configured = sdk.$configure({
        "chat.messages.$listener": (instance) => instance.setOptions({ fromConfigure: true }),
      });

      expect(configured.notifications.$listener.options).toStrictEqual({ fromInit: true });
      expect(configured.chat.messages.$listener.options).toStrictEqual({ fromConfigure: true });
    });
  });
});
