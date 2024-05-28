import { LoggerManager } from "@hyper-fetch/core";

import { createSocket } from "../../utils/socket.utils";

describe("Socket [ Methods ]", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should allow to set new query params config", async () => {
    const settings = { skipEmptyString: true };
    const socket = createSocket({ queryParamsConfig: settings });
    expect(socket.queryParamsConfig).toBe(settings);
  });

  it("should allow to set new query params stringify", async () => {
    const method = () => "";
    const socket = createSocket({ queryParamsStringify: method });
    expect(socket.queryParamsStringify).toBe(method);
  });

  it("should allow to activate debug", async () => {
    const socket = createSocket();
    socket.setDebug(true);
    expect(socket.debug).toBeTrue();
  });

  it("should allow to set log severity", async () => {
    const socket = createSocket();
    socket.setLoggerSeverity(3);
    expect(socket.loggerManager.severity).toBe(3);
  });

  it("should allow to set logger", async () => {
    const customLogger = new LoggerManager({ debug: true });
    const method = () => customLogger;
    const socket = createSocket();
    socket.setLogger(method);
    expect(socket.loggerManager).toBe(customLogger);
  });

  it("should allow to set auth and reconnect", async () => {
    const value = { test: 1 };
    const spy = jest.fn();
    const socket = createSocket();
    socket.adapter.reconnect = spy;
    socket.setAuth(value);
    expect(socket.auth).toBe(value);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should allow to set query and reconnect", async () => {
    const value = { test: 1 };
    const spy = jest.fn();
    const socket = createSocket();
    socket.adapter.reconnect = spy;
    socket.setQuery(value);
    expect(socket.queryParams).toBe(value);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
