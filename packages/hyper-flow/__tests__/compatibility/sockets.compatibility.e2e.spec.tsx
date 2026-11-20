import type { SocketInstance } from "@hyper-fetch/sockets";
import { waitForConnection } from "@hyper-fetch/testing";
import { screen, waitFor, within } from "@testing-library/react";

import { createHyperFlowEnv } from "../utils/hyper-flow";
import type { SocketCase } from "./sockets";
import { socketCases } from "./sockets";
import { useSocketsStore } from "@/store/applications/sockets.store";

const getApp = () => useSocketsStore.getState().applications.App;
const getRowTexts = () => screen.queryAllByTestId("socket-message").map((row) => row.textContent ?? "");

/**
 * Every socket inspector flow, once per socket adapter. `pnpm test:compatibility` reports it as a table.
 */
describe.each(socketCases)("Socket compatibility [ $name ]", (socketCase: SocketCase) => {
  const env = createHyperFlowEnv();
  const created: SocketInstance[] = [];

  beforeAll(() => socketCase.start());
  afterAll(() => socketCase.stop());

  beforeEach(async () => {
    await env.start();
  });

  afterEach(async () => {
    await Promise.all(
      created.splice(0).map((socket) => {
        // eslint-disable-next-line no-param-reassign
        socket.reconnectAttempts = 0;
        return socket.disconnect();
      }),
    );
    await env.stop();
  });

  const createSocket = (options?: Parameters<SocketCase["createSocket"]>[0]) => {
    const socket = socketCase.createSocket(options);
    created.push(socket);
    return socket;
  };

  const setup = async (options?: Parameters<SocketCase["createSocket"]>[0]) => {
    const socket = createSocket(options);
    const { plugin } = env.connectApp({ sockets: [socket] });
    const view = env.renderApp();
    await env.waitForApp(plugin);
    await view.navigate("/applications/App/sockets");
    await screen.findByTestId(`socket-card-${socketCase.getUrl()}`);
    return { socket, view, plugin };
  };

  const getSocket = () => getApp().sockets[socketCase.getUrl()];

  const connect = async (socket: SocketInstance) => {
    await socket.connect();
    await waitForConnection(socket);
    await waitFor(() => expect(getSocket().status).toBe("connected"));
  };

  it("registers the socket with its adapter", async () => {
    await setup();

    expect(getSocket()).toMatchObject({ url: socketCase.getUrl(), adapterName: socketCase.adapterName });
    expect(getSocket().status).toBe("disconnected");
  });

  it("follows connecting and connected", async () => {
    const { socket } = await setup();

    await connect(socket);

    const events = getApp()
      .messages.map((message) => message.event)
      .toReversed();
    expect(events.indexOf("SOCKET_CONNECTING" as never)).toBeLessThan(events.indexOf("SOCKET_CONNECTED" as never));
    expect(getSocket().connectedAt).toBeNumber();
  });

  it("lists received messages with their topic, data and size", async () => {
    const { socket } = await setup();
    await connect(socket);

    socketCase.push("prices", { symbol: "BTC", price: 100 });

    await waitFor(() => expect(getSocket().received).toBe(1));
    const [message] = getApp().messages.filter((item) => item.kind === "received");
    expect(message).toMatchObject({ topic: "prices", data: { symbol: "BTC", price: 100 } });
    expect(message.size).toBe(new Blob([JSON.stringify({ symbol: "BTC", price: 100 })]).size);
    await waitFor(() => expect(getRowTexts().some((text) => text.includes("BTC"))).toBeTrue());
  });

  it("keeps every message of a stream in order", async () => {
    const { socket } = await setup();
    await connect(socket);

    for (let index = 0; index < 50; index++) {
      socketCase.push("tick", { index });
    }

    await waitFor(() => expect(getSocket().received).toBe(50));
    const ticks = getApp()
      .messages.filter((item) => item.kind === "received")
      .map((item) => (item.data as { index: number }).index);
    expect(ticks).toStrictEqual(Array.from({ length: 50 }, (_, index) => 49 - index));
    expect(getSocket().topics.tick).toMatchObject({ received: 50, sent: 0 });
  });

  it("counts messages per topic", async () => {
    const { socket } = await setup();
    await connect(socket);

    socketCase.push("a", 1);
    socketCase.push("b", 2);
    socketCase.push("a", 3);

    await waitFor(() => expect(getSocket().received).toBe(3));
    expect(getSocket().topics.a.received).toBe(2);
    expect(getSocket().topics.b.received).toBe(1);
  });

  it("shows sending as the transport allows", async () => {
    const { socket } = await setup();
    await connect(socket);
    const emitter = socket.createEmitter<{ text: string }>()({ topic: "chat" });

    try {
      emitter.emit({ payload: { text: "hello" } });
    } catch {
      // SSE is receive-only, emitting throws in the app
    }

    if (socketCase.canSend) {
      await waitFor(() => expect(getSocket().sent).toBe(1));
      expect(getApp().messages.find((item) => item.kind === "sent")?.data).toStrictEqual({ text: "hello" });
    } else {
      // Nothing was sent, so nothing may be counted as sent
      await waitFor(() => expect(getSocket().status).toBe("connected"));
      expect(getSocket().sent).toBe(0);
    }
  });

  it("follows a disconnect by the app", async () => {
    const { socket } = await setup();
    await connect(socket);

    await socket.disconnect();

    await waitFor(() => expect(getSocket().status).toBe("disconnected"));
    expect(getSocket().connectedAt).toBeNull();
    expect(getApp().messages[0].event).toBe("SOCKET_DISCONNECTED");
  });

  it("follows the server dropping the connection", async () => {
    const { socket } = await setup();
    await connect(socket);

    socketCase.dropConnections();

    await waitFor(() => expect(getSocket().status).not.toBe("connected"));
    // SSE reconnects by itself, so it may already be connecting again
    expect(["disconnected", "connecting", "reconnecting", "failed"]).toContain(getSocket().status);
    expect(getApp().messages.some((item) => item.event === "SOCKET_DISCONNECTED")).toBeTrue();
  });

  it.skipIf(socketCase.resumesItself)("counts reconnection attempts and resets them once connected again", async () => {
    const { socket } = await setup({ reconnect: 5, reconnectTime: 20 });
    await connect(socket);

    socketCase.dropConnections();

    await waitFor(() => expect(getApp().messages.some((item) => item.event === "SOCKET_RECONNECTING")).toBeTrue());
    const reconnecting = getApp().messages.find((item) => item.event === "SOCKET_RECONNECTING");
    expect(reconnecting?.attempts).toBe(1);
    await waitFor(() => expect(getSocket().status).toBe("connected"));
    expect(getSocket().reconnectAttempts).toBe(0);
  });

  it.runIf(socketCase.resumesItself)("shows a dropped stream resuming on its own", async () => {
    const { socket } = await setup({ reconnect: 5, reconnectTime: 20 });
    await connect(socket);

    socketCase.dropConnections();

    await waitFor(() => expect(getApp().messages.some((item) => item.event === "SOCKET_DISCONNECTED")).toBeTrue());
    await waitFor(() => expect(getSocket().status).toBe("connected"));
    // The stream came back by itself, the socket did not have to reconnect
    expect(getApp().messages.some((item) => item.event === "SOCKET_RECONNECTING")).toBeFalse();
    expect(getSocket().reconnectAttempts).toBe(0);
  });

  it("re-registers the socket with its state after HyperFlow reloads", async () => {
    const socket = createSocket();
    const { plugin } = env.connectApp({ sockets: [socket] });
    const first = env.renderApp();
    await env.waitForApp(plugin);
    await connect(socket);

    first.unmount();
    await waitFor(() => expect(env.getServer()?.getAppConnection()).toBeNull());
    useSocketsStore.setState(useSocketsStore.getInitialState(), true);
    const view = env.renderApp();
    await env.waitForApp(plugin);
    await view.navigate("/applications/App/sockets");

    await waitFor(() => expect(getSocket()?.status).toBe("connected"));
  });

  it("opens the details of a message", async () => {
    const { socket, view } = await setup();
    await connect(socket);
    socketCase.push("profile", { name: "Maciej" });
    await waitFor(() => expect(getRowTexts().some((text) => text.includes("Maciej"))).toBeTrue());

    const row = screen.getAllByTestId("socket-message").find((element) => element.textContent?.includes("Maciej"))!;
    await view.user.click(row);

    const details = await screen.findByTestId("socket-message-details");
    expect(within(details).getByDisplayValue("Maciej")).toBeInTheDocument();
    expect(within(details).getByText("profile")).toBeInTheDocument();
  });
});
