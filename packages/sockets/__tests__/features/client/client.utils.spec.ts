import { getClient } from "client";
import { createSocket } from "../../utils/socket.utils";
import { createWsServer } from "../../websocket/websocket.server";

const windowInstance = global.window;

describe("Socket Client [ Utils ]", () => {
  let socket = createSocket();
  let windowSpy: jest.SpyInstance<Window & typeof globalThis, []>;

  beforeEach(() => {
    windowSpy = jest.spyOn(global, "window", "get");
    createWsServer();
    socket = createSocket();
    jest.resetAllMocks();
  });

  it("should allow to remove listener", async () => {
    const spy = jest.fn();
    socket.client.listeners.set("test", new Set<any>().add(spy));
    const removed = socket.client.removeListener("test", spy);
    expect(removed).toBeTrue();
  });

  it("should not throw when removing not existing listener", async () => {
    const spy = jest.fn();
    const removed = socket.client.removeListener("test", spy);
    expect(removed).toBeFalse();
  });

  describe("getClient utils no window", () => {
    beforeEach(() => {
      windowSpy.mockImplementation(() => undefined);
    });
    it("should not throw when there is no window", () => {
      const client = getClient(socket);
      expect(client).toBeNull();
    });
    it("should not throw SSE when there is no window", () => {
      socket = createSocket({ isSSE: true });
      const client = getClient(socket);
      expect(client).toBeNull();
    });
  });

  describe("getClient utils no instances", () => {
    beforeEach(() => {
      windowSpy.mockImplementation(() => ({} as any));
    });
    it("should not throw when there is no window", () => {
      const client = getClient(socket);
      expect(client).toBeNull();
    });
    it("should not throw SSE when there is no window", () => {
      socket = createSocket({ isSSE: true });
      const client = getClient(socket);
      expect(client).toBeNull();
    });
  });

  describe("getClient utils", () => {
    beforeEach(() => {
      windowSpy.mockImplementation(() => windowInstance);
      jest.clearAllMocks();
    });
    it("should create correct url with all parameters", () => {
      socket = createSocket({ auth: { foo: 1 }, queryParams: { bar: 2 } });
      const client = getClient(socket);
      expect(client.url).toBe("ws://localhost:1234/?foo=1&bar=2");
    });
    it("should create correct url with auth", () => {
      socket = createSocket({ auth: { foo: 1 } });
      const client = getClient(socket);
      expect(client.url).toBe("ws://localhost:1234/?foo=1");
    });
    it("should create correct url with query params", () => {
      socket = createSocket({ queryParams: { bar: 2 } });
      const client = getClient(socket);
      expect(client.url).toBe("ws://localhost:1234/?bar=2");
    });
    it("should initialize Websocket", () => {
      const client = getClient(socket);
      expect(client).toBeInstanceOf(WebSocket);
    });
    it("should initialize EventSource", () => {
      socket = createSocket({ isSSE: true });
      const client = getClient(socket);
      expect(client).toBeInstanceOf(EventSource);
    });
  });
});
