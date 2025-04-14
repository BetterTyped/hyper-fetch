import { createServer, Server } from "http";
import { WebSocket, WebSocketServer } from "ws";
import url from "url";

import { DevtoolsClientHandshakeMessage, MessageType, MessageTypes } from "../types/messages.types";
import { SocketTopics } from "frontend/constants/topics";
import { ConnectionHandler } from "./handlers/connection-handler";

const getConnectionName = (requestUrl: string) => {
  const queryParams = url.parse(requestUrl, true).query;
  const { connectionName } = (queryParams || {}) as { connectionName: string };
  return connectionName;
};

export type StartServer = {
  server: Server | null;
  wss: WebSocketServer | null;
  connections: Record<string, any>;
  DEVTOOLS_FRONTEND_WS_CONNECTION: WebSocket | null;
};

export const startServer = async (port = 1234): Promise<StartServer> => {
  const server = createServer();
  const wss = new WebSocketServer({ server });
  const connectionHandler = new ConnectionHandler();

  wss.on("connection", (wsConn, request) => {
    const connectionName = getConnectionName(request.url || "");

    if (!connectionName) {
      console.error("MISSING CONNECTION NAME", request.url);
      return;
    }

    connectionHandler.handleNewConnection(connectionName, wsConn);

    wsConn.on("error", console.error);
    wsConn.on("close", () => {
      const closedConnectionName = getConnectionName(request.url || "");
      if (!closedConnectionName) {
        return;
      }
      connectionHandler.handleClosedConnection(closedConnectionName);
    });
    wsConn.on("message", (msg: MessageTypes) => {
      const message = JSON.parse(msg.toString()) as MessageTypes;
      switch (message.data.messageType) {
        case MessageType.PLUGIN_INITIALIZED: {
          connectionHandler.sendConnectedAppsInfoToDevtoolsFrontend(
            message.data.connectionName,
            message as DevtoolsClientHandshakeMessage,
          );
          return;
        }
        case MessageType.DEVTOOLS_PLUGIN_CONFIRM: {
          connectionHandler.handleDevtoolsFrontendInitialization(message.data.connectionName);
          return;
        }
        // RECEIVED FROM HF_DEVTOOLS_FRONTEND --SENDING TO-- HF_DEVTOOLS_PLUGIN
        case MessageType.HF_DEVTOOLS_EVENT: {
          connectionHandler.sendMessageToDevtoolsPlugin(
            message.data.connectionName,
            JSON.stringify({ ...message, topic: SocketTopics.DEVTOOLS_PLUGIN_LISTENER }),
          );
          return;
        }
        // RECEIVED FROM HF_DEVTOOLS_PLUGIN --SENDING TO-- HF_DEVTOOLS_FRONTEND
        case MessageType.HF_APP_EVENT: {
          connectionHandler.sendMessageToDevtoolsFrontend(
            JSON.stringify({ ...message, topic: SocketTopics.DEVTOOLS_APP_CLIENT_LISTENER }),
          );
          return;
        }
        default:
          console.error("UNHANDLED MESSAGE TYPE", message);
      }
    });
  });

  wss.on("error", console.error);

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`WebSocket server is running on port ${port}`);
  });

  const isReady = new Promise((resolve) => {
    server.on("listening", () => {
      resolve(true);
    });
  });

  if (await isReady) {
    return {
      server,
      wss,
      connections: connectionHandler.connections,
      DEVTOOLS_FRONTEND_WS_CONNECTION: connectionHandler.devtoolsFrontendConnection,
    };
  }
  return { server: null, wss: null, connections: {}, DEVTOOLS_FRONTEND_WS_CONNECTION: null };
};
