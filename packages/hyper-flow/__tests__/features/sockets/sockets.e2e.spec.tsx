import { ServerSentEventsAdapter, Socket } from "@hyper-fetch/sockets";
import { createSseE2EServer, createWebsocketE2EServer, waitForConnection } from "@hyper-fetch/testing";
import { screen, waitFor, within } from "@testing-library/react";
import { EventSource as NodeEventSource } from "eventsource";

import { createHyperFlowEnv } from "../../utils/hyper-flow";
import { useSocketsStore } from "@/store/applications/sockets.store";

const getApp = () => useSocketsStore.getState().applications.App;
const getRows = () => screen.queryAllByTestId("socket-message");
const getRowTexts = () => getRows().map((row) => row.textContent ?? "");

describe("Sockets [ E2E ]", () => {
  const env = createHyperFlowEnv();
  const websocketServer = createWebsocketE2EServer();
  const sseServer = createSseE2EServer();
  let websocketUrl: string;
  let sseUrl: string;
  const sockets: Socket[] = [];

  beforeAll(async () => {
    websocketUrl = await websocketServer.startServer();
    sseUrl = await sseServer.startServer();
  });

  afterAll(async () => {
    await websocketServer.stopServer();
    await sseServer.stopServer();
  });

  beforeEach(async () => {
    await env.start();
  });

  afterEach(async () => {
    await Promise.all(sockets.splice(0).map((socket) => socket.disconnect()));
    await env.stop();
  });

  const createSocket = (url = websocketUrl) => {
    const socket = new Socket({ url, reconnect: 0, adapterOptions: { autoConnect: false } });
    sockets.push(socket);
    return socket;
  };

  /** Connects the socket and returns the server side of the connection */
  const connect = async (socket: Socket) => {
    const clientPromise = websocketServer.waitForClient();
    await socket.connect();
    await waitForConnection(socket);
    return clientPromise;
  };

  const setup = async (inspected: Socket[]) => {
    const { plugin } = env.connectApp({ sockets: inspected });
    const view = env.renderApp();
    await env.waitForApp(plugin);
    await view.navigate("/applications/App/sockets");
    return view;
  };

  it("should explain how to inspect sockets when there are none", async () => {
    await setup([]);

    expect(await screen.findByText("No sockets inspected")).toBeInTheDocument();
    expect(screen.getByText(/sockets: \[socket\]/)).toBeInTheDocument();
  });

  it("should show the socket with its adapter and follow its connection", async () => {
    const socket = createSocket();
    await setup([socket]);

    const card = await screen.findByTestId(`socket-card-${websocketUrl}`);
    expect(within(card).getByText("websockets")).toBeInTheDocument();
    expect(within(card).getByText("disconnected")).toBeInTheDocument();

    await connect(socket);
    await waitFor(() => expect(within(card).getByText("connected")).toBeInTheDocument());

    await socket.disconnect();
    await waitFor(() => expect(within(card).getByText("disconnected")).toBeInTheDocument());
    await waitFor(() => {
      const texts = getRowTexts();
      expect(texts.some((text) => text.includes("Connected"))).toBeTrue();
      expect(texts.some((text) => text.includes("Disconnected"))).toBeTrue();
    });
  });

  it("should list received messages with their topic, content and size", async () => {
    const socket = createSocket();
    const view = await setup([socket]);
    const client = await connect(socket);

    client.send(JSON.stringify({ topic: "chat", data: { text: "Hello" } }));

    await waitFor(() => expect(getRowTexts().some((text) => text.includes('{"text":"Hello"}'))).toBeTrue());
    const row = getRows().find((element) => element.textContent?.includes("Hello"))!;
    expect(within(row).getByText("chat")).toBeInTheDocument();
    expect(within(row).getByLabelText("Received")).toBeInTheDocument();
    // '{"text":"Hello"}' is 16 bytes
    expect(within(row).getByText("16 B")).toBeInTheDocument();
    expect(getApp().sockets[websocketUrl]).toMatchObject({ received: 1, bytesReceived: 16 });

    await view.user.click(row);
    const details = await screen.findByTestId("socket-message-details");
    expect(within(details).getByText("Data")).toBeInTheDocument();
    expect(within(details).getByDisplayValue("Hello")).toBeInTheDocument();
  });

  it("should list sent messages with their payload", async () => {
    const socket = createSocket();
    await setup([socket]);
    await connect(socket);

    socket
      .createEmitter<{ text: string }>()({ topic: "chat" })
      .emit({ payload: { text: "Hi there" } });

    await waitFor(() => expect(getRowTexts().some((text) => text.includes("Hi there"))).toBeTrue());
    const row = getRows().find((element) => element.textContent?.includes("Hi there"))!;
    expect(within(row).getByLabelText("Sent")).toBeInTheDocument();
    expect(getApp().sockets[websocketUrl]).toMatchObject({ sent: 1, topics: { chat: { sent: 1, received: 0 } } });
  });

  it("should filter the log by direction and search it by topic or content", async () => {
    const socket = createSocket();
    const view = await setup([socket]);
    const client = await connect(socket);
    client.send(JSON.stringify({ topic: "prices", data: { symbol: "BTC" } }));
    socket
      .createEmitter<{ room: string }>()({ topic: "join" })
      .emit({ payload: { room: "lobby" } });
    await waitFor(() => {
      expect(getRowTexts().some((text) => text.includes("BTC"))).toBeTrue();
      expect(getRowTexts().some((text) => text.includes("lobby"))).toBeTrue();
    });
    const filters = screen.getByRole("group", { name: "Filter messages" });

    await view.user.click(within(filters).getByRole("button", { name: "Received" }));
    await waitFor(() => expect(getRowTexts()).toHaveLength(1));
    expect(getRowTexts()[0]).toContain("BTC");

    await view.user.click(within(filters).getByRole("button", { name: "Sent" }));
    await waitFor(() => expect(getRowTexts()[0]).toContain("lobby"));
    expect(getRowTexts()).toHaveLength(1);

    await view.user.click(within(filters).getByRole("button", { name: "Connection" }));
    await waitFor(() =>
      expect(getRowTexts().every((text) => !text.includes("BTC") && !text.includes("lobby"))).toBeTrue(),
    );

    await view.user.click(within(filters).getByRole("button", { name: "All" }));
    await view.user.type(screen.getByRole("searchbox", { name: "Search messages" }), "lobby");
    await waitFor(() => expect(getRowTexts()).toHaveLength(1));
    expect(getRowTexts()[0]).toContain("join");
  });

  it("should show the messages of the selected socket", async () => {
    const chat = createSocket();
    const feed = createSocket(`${websocketUrl}/feed`);
    const view = await setup([chat, feed]);
    const chatClient = await connect(chat);
    const feedClient = await connect(feed);
    chatClient.send(JSON.stringify({ topic: "chat", data: "from chat" }));
    feedClient.send(JSON.stringify({ topic: "feed", data: "from feed" }));
    await waitFor(() => {
      expect(getRowTexts().some((text) => text.includes("from chat"))).toBeTrue();
      expect(getRowTexts().some((text) => text.includes("from feed"))).toBeTrue();
    });

    await view.user.click(screen.getByTestId(`socket-card-${websocketUrl}/feed`));

    await waitFor(() => expect(getRowTexts().some((text) => text.includes("from chat"))).toBeFalse());
    expect(getRowTexts().every((text) => !text.includes("chat"))).toBeTrue();
    expect(getRowTexts().some((text) => text.includes("from feed"))).toBeTrue();

    await view.user.click(screen.getByRole("button", { name: "All sockets" }));
    await waitFor(() => expect(getRowTexts().some((text) => text.includes("from chat"))).toBeTrue());
  });

  it("should show socket errors", async () => {
    const socket = createSocket();
    await setup([socket]);

    socket.events.emitError({ error: new Error("Handshake rejected") });

    await waitFor(() => expect(getRowTexts().some((text) => text.includes("Handshake rejected"))).toBeTrue());
    const row = getRows().find((element) => element.textContent?.includes("Handshake rejected"))!;
    expect(within(row).getByLabelText("Error")).toBeInTheDocument();
    expect(within(screen.getByTestId(`socket-card-${websocketUrl}`)).getByText("1 errors")).toBeInTheDocument();
  });

  it("should know the sockets and their state after HyperFlow reloads", async () => {
    const socket = createSocket();
    const { plugin } = env.connectApp({ sockets: [socket] });
    const first = env.renderApp();
    await env.waitForApp(plugin);
    await connect(socket);
    await waitFor(() => expect(getApp()?.sockets[websocketUrl]?.status).toBe("connected"));

    first.unmount();
    await waitFor(() => expect(env.getServer()?.getAppConnection()).toBeNull());
    useSocketsStore.setState(useSocketsStore.getInitialState(), true);

    const view = env.renderApp();
    await env.waitForApp(plugin);
    await view.navigate("/applications/App/sockets");

    const card = await screen.findByTestId(`socket-card-${websocketUrl}`);
    await waitFor(() => expect(within(card).getByText("connected")).toBeInTheDocument());
  });

  it("should clear the log but keep counting", async () => {
    const socket = createSocket();
    const view = await setup([socket]);
    const client = await connect(socket);
    client.send(JSON.stringify({ topic: "chat", data: "first" }));
    await waitFor(() => expect(getRowTexts().some((text) => text.includes("first"))).toBeTrue());

    await view.user.click(screen.getByRole("button", { name: /Clear messages/ }));

    expect(await screen.findByText("No messages yet")).toBeInTheDocument();
    client.send(JSON.stringify({ topic: "chat", data: "second" }));
    await waitFor(() => expect(getRowTexts()).toHaveLength(1));
    expect(getRowTexts()[0]).toContain("second");
    expect(getApp().sockets[websocketUrl].received).toBe(2);
  });

  it("should inspect server-sent events", async () => {
    const socket = new Socket({
      url: sseUrl,
      reconnect: 0,
      adapter: ServerSentEventsAdapter(),
      adapterOptions: { autoConnect: false, eventSourceImpl: NodeEventSource },
    });
    sockets.push(socket as unknown as Socket);
    await setup([socket as unknown as Socket]);
    await socket.connect();
    await waitForConnection(socket);

    sseServer.sendEvent("news", { title: "Released" });

    await waitFor(() => expect(getRowTexts().some((text) => text.includes("Released"))).toBeTrue());
    const card = screen.getByTestId(`socket-card-${sseUrl}`);
    expect(within(card).getByText("sse")).toBeInTheDocument();
    expect(within(card).getByText("connected")).toBeInTheDocument();
  });
});
