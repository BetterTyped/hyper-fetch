import { InternalEvents, MessageType } from "@hyper-fetch/plugin-devtools";
import { AppConnectionStatus, PluginConnectionStatus } from "@server/types/connection.type";
import { waitFor, configure } from "@testing-library/react";

import type { StartServer } from "../../src/server";
import { startServer } from "../../src/server";
import { connectDevtoolsFrontend, connectDevtoolsClient } from "../helpers/helpers";

configure({ asyncUtilTimeout: 10_000 });

const getRandomPort = () => 10_000 + Math.floor(Math.random() * 50_000);

describe("Devtools Socket Server", () => {
  let serverObject: StartServer | null = null;
  let port: number;
  beforeEach(async () => {
    port = getRandomPort();
    serverObject = await startServer({ port });
  });
  afterEach(async () => {
    await serverObject?.server?.close();
    await serverObject?.wss?.close();
    vi.clearAllMocks();
  });
  describe("If connection to the frontend is established and client is connected", () => {
    it("Should created the appropriate connections", async () => {
      const { connections, DEVTOOLS_FRONTEND_WS_CONNECTION } = serverObject || {};
      await connectDevtoolsFrontend({
        socketAddress: "localhost",
        socketPort: port,
      });
      connectDevtoolsClient({ socketPort: port });
      expect(DEVTOOLS_FRONTEND_WS_CONNECTION).toBeDefined();
      await waitFor(() => expect(Object.keys(connections || {}).length).toBeGreaterThan(0));
      expect(connections!["test-client"].appStatus).toEqual(AppConnectionStatus.IN_PROGRESS);
      expect(connections!["test-client"].pluginStatus).toEqual(PluginConnectionStatus.CONNECTED);
    });
  });
  describe("If connection to the frontend app is established and then disconnected and reconnected again", () => {
    it("Should allow for reconnection", async () => {
      let receivedMessage: any = null;
      const { DEVTOOLS_FRONTEND_WS_CONNECTION, connections } = serverObject || {};

      const socket = await connectDevtoolsFrontend({
        socketAddress: "localhost",
        socketPort: port,
      });
      socket.onMessage((message) => {
        receivedMessage = message;
        return message;
      });
      const { plugin } = await connectDevtoolsClient({ socketPort: port });
      await waitFor(() => expect(Object.keys(connections || {}).length).toBeGreaterThan(0));

      expect(DEVTOOLS_FRONTEND_WS_CONNECTION).toBeDefined();
      expect(connections?.["test-client"].ws).toBeDefined();

      await plugin.data.eventHandler?.socket.disconnect();
      await waitFor(() => expect(connections?.["test-client"].ws).toBeNull());
      await waitFor(() => expect(receivedMessage).toBeTruthy());
      expect(receivedMessage).toEqual({
        event: {
          messageType: MessageType.INTERNAL,
          connectionName: "test-client",
          eventType: InternalEvents.PLUGIN_HANGUP,
        },
      });

      await socket.disconnect();
      expect(DEVTOOLS_FRONTEND_WS_CONNECTION).toBeNull();

      await socket.connect();
      await plugin.data.eventHandler?.socket.connect();
      expect(DEVTOOLS_FRONTEND_WS_CONNECTION).toBeDefined();
      await waitFor(() => expect(connections?.["test-client"].ws).toBeDefined);
    });
  });
  describe("If the frontend connection is established and initialized", () => {
    it("Should send the appropriate metadata to the client", async () => {
      const clientReceivedMessages: any = [];
      const { connections } = serverObject || {};
      const socket = await connectDevtoolsFrontend({
        socketAddress: "localhost",
        socketPort: port,
      });
      socket.onMessage((message) => {
        clientReceivedMessages.push(message);
        return message;
      });
      const { client } = connectDevtoolsClient({ socketPort: port });
      await waitFor(() => expect(Object.keys(connections || {}).length).toBeGreaterThan(0));
      await waitFor(() => expect(clientReceivedMessages.length).toBeGreaterThan(0));
      const receivedMetaData = clientReceivedMessages[0].event;
      expect(receivedMetaData.clientOptions).toEqual(client.options);
      expect(receivedMetaData.adapterOptions).toEqual(client.adapter.options);
    });
  });
  describe("If the frontend connection is established then frontend is refreshed", () => {
    it("Should re-send the appropriate metadata to the client", async () => {
      const clientReceivedMessages: any = [];
      const { connections } = serverObject || {};
      const socket = await connectDevtoolsFrontend({
        socketAddress: "localhost",
        socketPort: port,
      });

      connectDevtoolsClient({ socketPort: port });
      await waitFor(() => expect(Object.keys(connections || {}).length).toBeGreaterThan(0));

      socket.onMessage((message) => {
        clientReceivedMessages.push(message);
        return message;
      });

      await socket.disconnect();
      await socket.connect();
      await waitFor(() => expect(clientReceivedMessages.length).toBeGreaterThan(0));
    });
  });
  describe("If something already blocks the port", () => {
    it("should not crash but return message", async () => {
      const secondServer = await startServer({ port });
      expect(secondServer.errorMessage).toBe(`Port ${port} is already in use`);
    });
  });
});
