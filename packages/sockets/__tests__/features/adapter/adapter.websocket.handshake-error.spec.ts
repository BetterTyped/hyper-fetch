import { WebsocketAdapter } from "adapter-websockets";
import { Socket } from "socket";

import {
  ControlledWebSocket,
  flushPromises,
  installControlledWebSocket,
  uninstallControlledWebSocket,
} from "../../utils/controlled-websocket";

/**
 * Node.js 22 reports a refused handshake with an `error` event only - no `close` follows and the socket stays
 * CONNECTING. The adapter must treat it as a failed attempt instead of waiting for the connection timeout.
 */
describe("Websocket Adapter [ Handshake error without close ]", () => {
  // The lower end of the reconnection jitter - every delay is exactly `reconnectTime`
  let random = vi.spyOn(Math, "random");
  beforeEach(() => {
    random = vi.spyOn(Math, "random").mockReturnValue(0);
  });
  afterEach(() => {
    random.mockRestore();
  });

  let socket: Socket;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    installControlledWebSocket();
    socket = new Socket({
      url: "ws://refused",
      reconnectTime: 10,
      connectionTimeout: 5000,
      adapter: WebsocketAdapter(),
    });
  });

  afterEach(async () => {
    socket.adapter.setForceClosed(true);
    vi.clearAllTimers();
    vi.useRealTimers();
    uninstallControlledWebSocket();
  });

  it("should start the next attempt after the reconnect delay", async () => {
    await flushPromises();
    ControlledWebSocket.instances[0].serverRefuseWithoutClose();

    await vi.advanceTimersByTimeAsync(10);

    expect(ControlledWebSocket.instances).toHaveLength(2);
  });

  it("should stop connecting and report the failed attempt", async () => {
    const onError = vi.fn();
    socket.onError(onError);
    await flushPromises();

    ControlledWebSocket.instances[0].serverRefuseWithoutClose();

    expect(socket.adapter.connecting).toBeFalse();
    expect(onError).toHaveBeenCalled();
  });

  it("should connect once the server accepts the next attempt", async () => {
    const onConnected = vi.fn();
    socket.events.onConnected(onConnected);
    await flushPromises();
    ControlledWebSocket.instances[0].serverRefuseWithoutClose();
    await vi.advanceTimersByTimeAsync(10);

    ControlledWebSocket.instances[1].serverOpen();
    await flushPromises();

    expect(onConnected).toHaveBeenCalledTimes(1);
    expect(socket.adapter.connected).toBeTrue();
  });

  it("should ignore the close that browsers send after the error", async () => {
    const onReconnecting = vi.fn();
    socket.events.onReconnecting(onReconnecting);
    await flushPromises();
    const transport = ControlledWebSocket.instances[0];

    transport.serverRefuseWithoutClose();
    transport.serverClose({ code: 1006 });
    await vi.advanceTimersByTimeAsync(10);

    expect(onReconnecting).toHaveBeenCalledTimes(1);
    expect(ControlledWebSocket.instances).toHaveLength(2);
  });

  it("should disconnect without waiting for a close that never comes", async () => {
    await flushPromises();
    ControlledWebSocket.instances[0].serverRefuseWithoutClose();

    await expect(socket.disconnect()).resolves.toBeUndefined();
    expect(socket.adapter.connected).toBeFalse();
  });

  it("should keep handling errors of an open connection through the close event", async () => {
    await flushPromises();
    const transport = ControlledWebSocket.instances[0];
    transport.serverOpen();
    await flushPromises();

    transport.dispatchEvent(new Event("error"));

    expect(socket.adapter.connected).toBeTrue();
  });
});
