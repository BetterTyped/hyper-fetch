import { createWebsocketMockingServer } from "@hyper-fetch/testing";
import { getServerSentEventsAdapter } from "adapter-sse/sse-adapter.utils";
import { getWebsocketAdapter } from "adapter-websockets/websocket-adapter.utils";
import type { MockInstance } from "vitest";

import { removeImplementation } from "../../utils/environment.utils";
import { createSocket } from "../../utils/socket.utils";

const windowInstance = global.window;

describe("Socket Client [ Utils ]", () => {
  const { startServer } = createWebsocketMockingServer();
  let socket = createSocket();
  let windowSpy: MockInstance;
  const url = "ws://localhost:1234";

  beforeEach(async () => {
    startServer();
    windowSpy = vi.spyOn(global, "window", "get");
    socket = createSocket();
    vi.resetAllMocks();
  });

  it("should allow to remove listener", async () => {
    const spy = vi.fn();
    const spy2 = vi.fn();
    socket.adapter.listeners.set("test", new Map<any, any>().set(spy, spy2));
    const removed = socket.adapter.removeListener({ topic: "test", callback: spy });
    expect(removed).toBeTrue();
    expect(spy2).toHaveBeenCalledOnce();
  });

  it("should not throw when removing not existing listener", async () => {
    const spy = vi.fn();
    const removed = socket.adapter.removeListener({ topic: "test", callback: spy });
    expect(removed).toBeFalse();
  });

  describe("getAdapter utils without an implementation", () => {
    const restores: (() => void)[] = [];
    beforeEach(() => {
      restores.push(removeImplementation("WebSocket"), removeImplementation("EventSource"));
    });
    afterEach(() => {
      restores.splice(0).forEach((restore) => restore());
    });
    it("should not throw when there is no WebSocket", () => {
      const adapter = getWebsocketAdapter(url, {});
      expect(adapter).toBeNull();
    });
    it("should not throw when there is no EventSource", () => {
      const adapter = getServerSentEventsAdapter(url, {});
      expect(adapter).toBeNull();
    });
    it("should ignore implementations that are not classes", () => {
      // Misconfigured values from untyped code
      const notAWebSocket = {} as unknown as typeof WebSocket;
      const notAnEventSource = {} as unknown as typeof EventSource;
      expect(getWebsocketAdapter(url, { webSocketImpl: notAWebSocket })).toBeNull();
      expect(getServerSentEventsAdapter(url, { eventSourceImpl: notAnEventSource })).toBeNull();
    });
  });

  describe("getAdapter utils with an implementation option", () => {
    it("should use webSocketImpl over the global WebSocket", () => {
      class CustomWebSocket extends WebSocket {}
      const adapter = getWebsocketAdapter(url, { webSocketImpl: CustomWebSocket });
      expect(adapter).toBeInstanceOf(CustomWebSocket);
    });
    it("should use eventSourceImpl over the global EventSource", () => {
      class CustomEventSource extends windowInstance.EventSource {}
      const adapter = getServerSentEventsAdapter(url, { eventSourceImpl: CustomEventSource });
      expect(adapter).toBeInstanceOf(CustomEventSource);
    });
    it("should not need a window when an implementation is passed", () => {
      windowSpy.mockImplementation(() => undefined as unknown as Window & typeof globalThis);
      expect(getWebsocketAdapter(url, { webSocketImpl: WebSocket })).toBeInstanceOf(WebSocket);
    });
  });

  describe("getWebsocketAdapter utils", () => {
    beforeEach(() => {
      windowSpy.mockImplementation(() => windowInstance);
      vi.clearAllMocks();
    });
    it("should create correct url", () => {
      socket = createSocket({ queryParams: { bar: 2 } });
      const adapter = getWebsocketAdapter(url, {});
      expect(adapter?.url).toBe(`${url}/`);
    });
    it("should initialize Websocket", () => {
      const adapter = getWebsocketAdapter(url, {});
      expect(adapter).toBeInstanceOf(WebSocket);
    });
    it("should initialize EventSource", () => {
      const adapter = getServerSentEventsAdapter(url, {});
      expect(adapter).toBeInstanceOf(EventSource);
    });
  });
});
