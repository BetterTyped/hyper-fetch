import { LoggerManager } from "@hyper-fetch/core";

import { createSocket } from "../../utils/socket.utils";
import { WebsocketAdapter } from "adapter-websockets/websocket-adapter";

describe("Socket [ Methods ]", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should allow to set new query params config", async () => {
    const settings = { skipEmptyString: true };
    const adapter = WebsocketAdapter().setQueryParamsConfig(settings);
    const socket = createSocket({ adapter: () => adapter });
    expect(socket.adapter.queryParamsConfig).toBe(settings);
  });

  it("should allow to set new query params stringify", async () => {
    const method = () => "testing";
    const adapter = WebsocketAdapter().setQueryParamsMapper(method);
    const socket = createSocket({ adapter: () => adapter });
    const queryParams = socket.adapter.unsafe_queryParamsMapper();
    expect(queryParams).toBe("testing");
  });

  it("should allow to activate debug", async () => {
    const socket = createSocket();
    socket.setDebug(true);
    expect(socket.debug).toBeTrue();
  });

  it("should allow to set log severity", async () => {
    const socket = createSocket();
    socket.setLogLevel("info");
    expect(socket.loggerManager.level).toBe("info");
  });

  it("should allow to set logger", async () => {
    const customLogger = new LoggerManager();
    const method = () => customLogger;
    const socket = createSocket();
    socket.setLogger(method);
    expect(socket.loggerManager).toBe(customLogger);
  });

  it("should allow to set query and reconnect", async () => {
    const value = { test: 1 };
    const spy = jest.fn();
    const socket = createSocket();
    socket.adapter.reconnect = spy;
    socket.adapter.setQueryParams(value);
    expect(socket.adapter.queryParams).toBe(value);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
