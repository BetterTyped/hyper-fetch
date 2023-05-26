import { waitFor } from "@testing-library/dom";

import { createEmitter } from "../../utils/emitter.utils";
import { createSocket } from "../../utils/socket.utils";
import { createWsServer } from "../../websocket/websocket.server";

describe("Socket Adapter [ Callbacks ]", () => {
  let server = createWsServer();

  beforeEach(() => {
    server = createWsServer();
    jest.resetAllMocks();
  });

  it("should trigger onOpen callbacks", async () => {
    const spy = jest.fn();
    createSocket().onOpen(spy);

    await waitFor(() => {
      expect(spy).toBeCalledTimes(1);
    });
  });

  it("should trigger onClose callbacks", async () => {
    const spy = jest.fn();
    const socket = createSocket().onClose(spy);
    socket.adapter.disconnect();

    await waitFor(() => {
      expect(spy).toBeCalledTimes(1);
    });
  });

  it("should trigger onError callbacks", async () => {
    const spy = jest.fn();
    createSocket().onError(spy);
    server.error();

    await waitFor(() => {
      expect(spy).toBeCalledTimes(1);
    });
  });

  it("should trigger onMessage callbacks", async () => {
    const spy = jest.fn().mockImplementation((res) => res);
    createSocket().onMessage(spy);
    server.send({ data: { name: "test", data: "test" } });

    await waitFor(() => {
      expect(spy).toBeCalledTimes(1);
    });
  });

  it("should trigger onSend callbacks", async () => {
    const spy = jest.fn().mockImplementation((em) => em);
    const socket = createSocket().onSend(spy);
    const emitter = createEmitter(socket);

    await server.connected;

    emitter.setData({ test: "1" }).emit();

    await waitFor(() => {
      expect(spy).toBeCalledTimes(1);
    });
  });

  it("should trigger onReconnect callbacks", async () => {
    const spy = jest.fn();
    const socket = createSocket().onReconnect(spy);
    socket.adapter.reconnect();

    await waitFor(() => {
      expect(spy).toBeCalledTimes(1);
    });
  });

  it("should trigger onReconnectStop callbacks", async () => {
    const spy = jest.fn();
    const socket = createSocket({ reconnect: 0 }).onReconnectStop(spy);
    socket.adapter.reconnect();

    await waitFor(() => {
      expect(spy).toBeCalledTimes(1);
    });
  });
});
