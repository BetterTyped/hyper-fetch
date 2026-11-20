import { Socket } from "@hyper-fetch/sockets";
import { createWebsocketE2EServer, waitForConnection } from "@hyper-fetch/testing";
import { screen, waitFor, within } from "@testing-library/react";

import { createHyperFlowEnv } from "../../utils/hyper-flow";

const getRows = () => screen.queryAllByTestId("socket-message");
const getRowTexts = () => getRows().map((row) => row.textContent ?? "");
const findRow = (text: string) =>
  waitFor(() => {
    const row = getRows().find((element) => element.textContent?.includes(text));
    if (!row) {
      throw new Error(`No message row with ${text}`);
    }
    return row;
  });

describe("Sockets [ Message details ]", () => {
  const env = createHyperFlowEnv();
  const websocketServer = createWebsocketE2EServer();
  let websocketUrl: string;
  const sockets: Socket[] = [];

  beforeAll(async () => {
    websocketUrl = await websocketServer.startServer();
  });

  afterAll(async () => {
    await websocketServer.stopServer();
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

  it("should show a sent text payload and close the details", async () => {
    const socket = createSocket();
    const view = await setup([socket]);
    await connect(socket);

    socket.createEmitter<string>()({ topic: "ping" }).emit({ payload: "are you there" });

    await view.user.click(await findRow("are you there"));
    const details = within(await screen.findByTestId("socket-message-details"));
    expect(details.getByText("Payload")).toBeInTheDocument();
    expect(details.getByText("ping")).toBeInTheDocument();
    expect(details.getByDisplayValue("are you there")).toBeInTheDocument();

    await view.user.click(details.getByRole("button", { name: "Close" }));

    await waitFor(() => {
      expect(screen.queryByTestId("socket-message-details")).not.toBeInTheDocument();
    });
  });

  it("should shorten long contents in the log", async () => {
    const socket = createSocket();
    await setup([socket]);
    const client = await connect(socket);
    const text = "x".repeat(200);

    client.send(JSON.stringify({ topic: "logs", data: text }));

    const row = await findRow("x".repeat(120));
    expect(row).toHaveTextContent(`${"x".repeat(120)}…`);
    expect(row).not.toHaveTextContent("x".repeat(121));
  });

  it("should list a message without data with an empty content", async () => {
    const socket = createSocket();
    await setup([socket]);
    await connect(socket);

    socket.createEmitter<undefined>()({ topic: "heartbeat" }).emit({ payload: undefined });

    const row = await findRow("heartbeat");
    expect(within(row).getByLabelText("Sent")).toBeInTheDocument();
    expect(row.querySelectorAll("td")[3]).toHaveTextContent(/^$/);
  });

  it("should show failed sends with their error", async () => {
    const socket = createSocket();
    const view = await setup([socket]);
    const emitter = socket.createEmitter<{ text: string }>()({ topic: "chat" }).setPayload({ text: "lost" });

    socket.events.emitEmitterError({ error: new Error("Socket is closed"), emitter });

    const row = await findRow("Socket is closed");
    expect(within(row).getByLabelText("Error")).toBeInTheDocument();
    expect(within(screen.getByTestId(`socket-card-${websocketUrl}`)).getByText("1 failed sends")).toBeInTheDocument();

    await view.user.click(row);
    const details = within(await screen.findByTestId("socket-message-details"));
    expect(details.getByText("Payload")).toBeInTheDocument();
    expect(details.getByDisplayValue("lost")).toBeInTheDocument();
    const error = within(details.getByRole("region", { name: "Message error" }));
    expect(error.getByDisplayValue("Socket is closed")).toBeInTheDocument();
  });

  it("should label errors that come without a message", async () => {
    const socket = createSocket();
    const view = await setup([socket]);

    socket.events.emitError({ error: new Error("") });

    await waitFor(() => expect(getRowTexts().some((text) => text.includes("Error"))).toBeTrue());
    const row = getRows().find((element) => within(element).queryByLabelText("Error"))!;
    expect(row.querySelectorAll("td")[3]).toHaveTextContent("Error");

    await view.user.click(row);
    const details = within(await screen.findByTestId("socket-message-details"));
    expect(details.getByRole("region", { name: "Message error" })).toBeInTheDocument();
  });

  it("should title connection events by what happened", async () => {
    const socket = createSocket();
    const view = await setup([socket]);
    await connect(socket);

    await view.user.click(await findRow("Connected"));

    const details = within(await screen.findByTestId("socket-message-details"));
    expect(details.getByText("Connected")).toBeInTheDocument();
    expect(details.queryByRole("region", { name: "Message data" })).not.toBeInTheDocument();
  });

  it("should show every socket again when the selected one is clicked again", async () => {
    const chat = createSocket();
    const feed = createSocket(`${websocketUrl}/feed`);
    const view = await setup([chat, feed]);
    const chatClient = await connect(chat);
    const feedClient = await connect(feed);
    chatClient.send(JSON.stringify({ topic: "chat", data: "from chat" }));
    feedClient.send(JSON.stringify({ topic: "feed", data: "from feed" }));
    await findRow("from chat");
    await findRow("from feed");
    const feedCard = screen.getByTestId(`socket-card-${websocketUrl}/feed`);

    await view.user.click(feedCard);
    await waitFor(() => expect(getRowTexts().some((text) => text.includes("from chat"))).toBeFalse());
    expect(feedCard).toHaveAttribute("aria-pressed", "true");

    await view.user.click(feedCard);

    await findRow("from chat");
    expect(feedCard).toHaveAttribute("aria-pressed", "false");
  });

  it("should tell when no message matches the search", async () => {
    const socket = createSocket();
    const view = await setup([socket]);
    const client = await connect(socket);
    client.send(JSON.stringify({ topic: "chat", data: "hello" }));
    await findRow("hello");

    await view.user.type(screen.getByRole("searchbox", { name: "Search messages" }), "nothing like it");

    expect(await screen.findByText("No matching messages")).toBeInTheDocument();
    expect(screen.queryByText("No messages yet")).not.toBeInTheDocument();
  });
});
