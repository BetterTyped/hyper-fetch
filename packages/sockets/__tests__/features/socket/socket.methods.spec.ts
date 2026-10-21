import { LoggerManager } from "@hyper-fetch/core";
import { createWebsocketMockingServer, waitForConnection } from "@hyper-fetch/testing";
import { waitFor } from "@testing-library/dom";
import { WebsocketAdapter } from "adapter-websockets/websocket-adapter";
import { Socket } from "socket";

describe("Socket [ Methods ]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should allow to set new query params config", async () => {
    const settings = { skipEmptyString: true };
    const adapter = WebsocketAdapter().setQueryParamsConfig(settings);
    const socket = new Socket({ url: "ws://localhost:1234", adapter });
    expect(socket.adapter.queryParamsConfig).toBe(settings);
  });

  it("should allow to set new query params stringify", async () => {
    const method = () => "testing";
    const socket = new Socket({ url: "ws://localhost:1234", adapterOptions: { autoConnect: false } });
    socket.adapter.setQueryParamsMapper(method);
    const queryParams = socket.adapter.unstable_queryParamsMapper({ test: 1 });
    expect(queryParams).toBe("testing");
  });

  it("should allow to set url without touching the live connection", async () => {
    const socket = new Socket({ url: "ws://localhost:1234", adapterOptions: { autoConnect: false } });
    const reconnectSpy = vi.spyOn(socket.adapter, "reconnect");

    expect(socket.setUrl("ws://localhost:4321")).toBe(socket);
    expect(socket.url).toBe("ws://localhost:4321");
    expect(reconnectSpy).not.toHaveBeenCalled();
  });

  it("should connect to the new url on reconnect and keep listeners", async () => {
    // startServer() cleans every mocked server, so the second one is created only after the first started
    const first = createWebsocketMockingServer("ws://localhost:1234");
    first.startServer();
    const second = createWebsocketMockingServer("ws://localhost:4321");

    const socket = new Socket({ url: "ws://localhost:1234" });
    const listener = socket.createListener<{ value: number }>()({ topic: "topic" });
    const spy = vi.fn();
    listener.listen(({ data }) => spy(data));
    await waitForConnection(socket);
    await first.getServer().connected;

    socket.setUrl("ws://localhost:4321");
    await socket.reconnect();
    await second.getServer().connected;
    await waitForConnection(socket);

    second.emitListenerEvent(listener, { value: 2 });

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({ value: 2 });
    });

    await socket.disconnect();
    first.stopServer();
    second.stopServer();
  });

  it("should allow to activate debug", async () => {
    const socket = new Socket({ url: "ws://localhost:1234" });
    socket.setDebug(true);
    expect(socket.debug).toBeTrue();
  });

  it("should allow to set log severity", async () => {
    const socket = new Socket({ url: "ws://localhost:1234" });
    socket.setLogLevel("info");
    expect(socket.loggerManager.level).toBe("info");
  });

  it("should allow to set logger", async () => {
    const customLogger = new LoggerManager();
    const method = () => customLogger;
    const socket = new Socket({ url: "ws://localhost:1234" });
    socket.setLogger(method);
    expect(socket.loggerManager).toBe(customLogger);
  });

  it("should allow to set query", async () => {
    const value = { test: 1 };
    const socket = new Socket({ url: "ws://localhost:1234" });
    socket.adapter.setQueryParams(value);
    expect(socket.adapter.queryParams).toBe(value);
  });
});
