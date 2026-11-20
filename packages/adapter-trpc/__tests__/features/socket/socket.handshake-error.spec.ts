import { Socket } from "@hyper-fetch/sockets";

import { TrpcWebsocketAdapter } from "../../../src";
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
describe("Trpc Websocket Adapter [ Handshake error without close ]", () => {
  let socket: Socket<ReturnType<typeof TrpcWebsocketAdapter>>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    installControlledWebSocket();
    socket = new Socket({
      url: "ws://refused",
      reconnectTime: 10,
      connectionTimeout: 5000,
      adapter: TrpcWebsocketAdapter(),
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
    expect(socket.adapter.connecting).toBeTrue();
  });

  it("should stop connecting and report the failed attempt", async () => {
    const onError = vi.fn();
    socket.onError(onError);
    await flushPromises();

    ControlledWebSocket.instances[0].serverRefuseWithoutClose();

    expect(socket.adapter.connecting).toBeFalse();
    expect(onError).toHaveBeenCalled();
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

  it("should not treat an error of an open connection as a failed handshake", async () => {
    await flushPromises();
    const transport = ControlledWebSocket.instances[0];
    transport.serverOpen();
    await flushPromises();

    transport.dispatchEvent(new Event("error"));

    expect(socket.adapter.connected).toBeTrue();
  });
});
