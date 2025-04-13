import { waitFor } from "@testing-library/react";

import { MessageType } from "types/messages.types";
import { StartServer, startServer } from "../../src/server";
import { connectDevtoolsFrontend, connectDevtoolsClient } from "../helpers/helpers";

describe("Devtools Socket Server", () => {
  let serverObject: StartServer | null = null;
  beforeEach(async () => {
    serverObject = await startServer();
  });
  afterEach(async () => {
    await serverObject?.server?.close();
    jest.clearAllMocks();
  });
  describe("If connection to the frontend is established and client is connected", () => {
    it("Should created the appropriate connections", async () => {
      const { connections, DEVTOOLS_FRONTEND_WS_CONNECTION } = serverObject || {};
      await connectDevtoolsFrontend({
        socketAddress: "localhost",
        socketPort: 1234,
      });
      await connectDevtoolsClient();
      expect(DEVTOOLS_FRONTEND_WS_CONNECTION).toBeDefined();
      await waitFor(() => expect(Object.keys(connections || {}).length).toBeGreaterThan(0));
    });
  });
  describe("If connection to the frontend app is established and then disconnected and reconnected again", () => {
    it("Should allow for reconnection", async () => {
      let receivedMessage: any = null;
      const { DEVTOOLS_FRONTEND_WS_CONNECTION, connections } = serverObject || {};

      const socket = await connectDevtoolsFrontend({
        socketAddress: "localhost",
        socketPort: 1234,
      });
      socket.onMessage((message) => {
        receivedMessage = message;
        return message;
      });
      const { plugin } = await connectDevtoolsClient();
      await waitFor(() => expect(Object.keys(connections || {}).length).toBeGreaterThan(0));

      expect(DEVTOOLS_FRONTEND_WS_CONNECTION).toBeDefined();
      expect(connections?.["HF_DEVTOOLS_CLIENT_test-client"].ws).toBeDefined();

      await plugin.data.eventHandler?.socket.disconnect();
      await waitFor(() => expect(connections?.["HF_DEVTOOLS_CLIENT_test-client"].ws).toBeNull());
      await waitFor(() => expect(receivedMessage).toBeTruthy());
      expect(receivedMessage).toEqual({
        event: { messageType: MessageType.DEVTOOLS_CLIENT_HANGUP, connectionName: "HF_DEVTOOLS_CLIENT_test-client" },
      });

      await socket.disconnect();
      expect(DEVTOOLS_FRONTEND_WS_CONNECTION).toBeNull();

      await socket.connect();
      await plugin.data.eventHandler?.socket.connect();
      expect(DEVTOOLS_FRONTEND_WS_CONNECTION).toBeDefined();
      await waitFor(() => expect(connections?.["HF_DEVTOOLS_CLIENT_test-client"].ws).toBeDefined);
    });
  });
  describe("If the frontend connection is established and initialized", () => {
    it("Should send the appropriate metadata to the client", async () => {
      const clientReceivedMessages: any = [];
      const { connections } = serverObject || {};
      const socket = await connectDevtoolsFrontend({
        socketAddress: "localhost",
        socketPort: 1234,
      });
      socket.onMessage((message) => {
        clientReceivedMessages.push(message);
        return message;
      });
      const { client } = connectDevtoolsClient();
      await waitFor(() => expect(Object.keys(connections || {}).length).toBeGreaterThan(0));
      await waitFor(() => expect(clientReceivedMessages.length).toBeGreaterThan(0));
      const receivedMetaData = clientReceivedMessages[0].event.eventData;
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
        socketPort: 1234,
      });

      connectDevtoolsClient();
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
});
