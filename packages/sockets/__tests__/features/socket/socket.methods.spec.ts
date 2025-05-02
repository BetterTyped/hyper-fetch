import { LoggerManager } from "@hyper-fetch/core";

import { Socket } from "socket";
import { WebsocketAdapter } from "adapter-websockets/websocket-adapter";

describe("Socket [ Methods ]", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should allow to set new query params config", async () => {
    const settings = { skipEmptyString: true };
    const adapter = WebsocketAdapter().setQueryParamsConfig(settings);
    const socket = new Socket({ url: "ws://localhost:1234", adapter });
    expect(socket.adapter.queryParamsConfig).toBe(settings);
  });

  it("should allow to set new query params stringify", async () => {
    const method = () => "testing";
    const socket = new Socket({ url: "ws://localhost:1234" });
    socket.adapter.setQueryParamsMapper(method);
    const queryParams = socket.adapter.unsafe_queryParamsMapper({ test: 1 });
    expect(queryParams).toBe("testing");
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
