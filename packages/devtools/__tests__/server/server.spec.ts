import { MessageType } from "types/messages.types";
import { startServer } from "../../src/server";
import { connectDevtoolsFrontend, connectDevtoolsClient, listenForServerMessage } from "../helpers/helpers";
import { waitFor } from "@testing-library/react";
// TODO handle lost connection from client
describe("Devtools Socket Server", () => {
  describe("If connection to the frontend is established and client is connected", () => {
    it("Should created the appropriate connections", async () => {
      const { connections, DEVTOOLS_FRONTEND_WS_CONNECTION } = (await startServer()) || {};
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
      let receivedMessage = null;
      const { DEVTOOLS_FRONTEND_WS_CONNECTION, connections } = (await startServer()) || {};

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

      await plugin.data.emitter?.socket.disconnect();
      await waitFor(() => expect(connections?.["HF_DEVTOOLS_CLIENT_test-client"].ws).toBeNull);
      await waitFor(() => expect(receivedMessage).toBeDefined);
      expect(receivedMessage).toEqual({
        event: { messageType: MessageType.DEVTOOLS_CLIENT_HANGUP, connectionName: "HF_DEVTOOLS_CLIENT_test-client" },
      });

      await socket.disconnect();
      expect(DEVTOOLS_FRONTEND_WS_CONNECTION).toBeNull();

      await socket.connect();
      await plugin.data.emitter?.socket.connect();
      expect(DEVTOOLS_FRONTEND_WS_CONNECTION).toBeDefined();
      await waitFor(() => expect(connections?.["HF_DEVTOOLS_CLIENT_test-client"].ws).toBeDefined);
    });
  });
});
