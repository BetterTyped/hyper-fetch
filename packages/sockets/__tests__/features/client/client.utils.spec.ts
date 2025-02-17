import { createWebsocketMockingServer } from "@hyper-fetch/testing";

import { createSocket } from "../../utils/socket.utils";
import { getWebsocketAdapter } from "adapter-websockets/websocket-adapter.utils";
import { getServerSentEventsAdapter } from "adapter-sse/sse-adapter.utils";

const windowInstance = global.window;

describe("Socket Client [ Utils ]", () => {
  const { startServer } = createWebsocketMockingServer();
  let socket = createSocket();
  let windowSpy: jest.SpyInstance<Window & typeof globalThis, []>;
  const url = "ws://localhost:1234";

  beforeEach(async () => {
    startServer();
    windowSpy = jest.spyOn(global, "window", "get");
    socket = createSocket();
    jest.resetAllMocks();
  });

  it("should allow to remove listener", async () => {
    const spy = jest.fn();
    const spy2 = jest.fn();
    socket.adapter.listeners.set("test", new Map<any, any>().set(spy, spy2));
    const removed = socket.adapter.removeListener({ topic: "test", callback: spy });
    expect(removed).toBeTrue();
    expect(spy2).toHaveBeenCalledOnce();
  });

  it("should not throw when removing not existing listener", async () => {
    const spy = jest.fn();
    const removed = socket.adapter.removeListener({ topic: "test", callback: spy });
    expect(removed).toBeFalse();
  });

  describe("getAdapter utils no window", () => {
    beforeEach(() => {
      windowSpy.mockImplementation(() => undefined as any);
    });
    it("should not throw when there is no window", () => {
      const adapter = getWebsocketAdapter(url, {});
      expect(adapter).toBeNull();
    });
    it("should not throw SSE when there is no window", () => {
      const adapter = getServerSentEventsAdapter(url, {});
      expect(adapter).toBeNull();
    });
  });

  describe("getAdapter utils no instances", () => {
    beforeEach(() => {
      windowSpy.mockImplementation(() => ({}) as any);
    });
    it("should not throw when there is no window", () => {
      const adapter = getWebsocketAdapter(url, {});
      expect(adapter).toBeNull();
    });
    it("should not throw SSE when there is no window", () => {
      const adapter = getServerSentEventsAdapter(url, {});
      expect(adapter).toBeNull();
    });
  });

  describe("getWebsocketAdapter utils", () => {
    beforeEach(() => {
      windowSpy.mockImplementation(() => windowInstance);
      jest.clearAllMocks();
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
