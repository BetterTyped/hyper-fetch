import { createWebsocketMockingServer } from "@hyper-fetch/testing";
import { getServerSentEventsAdapter } from "adapter-sse/sse-adapter.utils";
import { getWebsocketAdapter } from "adapter-websockets/websocket-adapter.utils";
import type { MockInstance } from "vitest";

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

  describe("getAdapter utils without the global constructors", () => {
    const originalEventSource = globalThis.EventSource;

    afterEach(() => {
      vi.unstubAllGlobals();
      globalThis.EventSource = originalEventSource;
    });

    it("should return null when the runtime has no WebSocket", () => {
      vi.stubGlobal("WebSocket", null);
      expect(getWebsocketAdapter(url, {})).toBeNull();
    });
    it("should return null when the runtime has no EventSource", () => {
      globalThis.EventSource = undefined as unknown as typeof EventSource;
      expect(getServerSentEventsAdapter(url, {})).toBeNull();
    });
    it("should not read window", () => {
      windowSpy.mockImplementation(() => undefined as any);
      expect(getWebsocketAdapter(url, {})).toBeInstanceOf(WebSocket);
      expect(getServerSentEventsAdapter(url, {})).toBeInstanceOf(EventSource);
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
