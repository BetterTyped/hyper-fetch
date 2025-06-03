import { createServer, Server } from "http";
import { WebSocket, WebSocketServer } from "ws";
import url from "url";

import { DevtoolsClientHandshakeMessage, MessageType, MessageTypes } from "../shared/types/messages.types";
import { SocketTopics } from "frontend/constants/topics";
import { ConnectionHandler } from "./handlers/connection-handler";
import { serverLogger } from "../shared/utils/logger";

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

export const startServer = async (options: { port: number; onServerCrash?: () => void }): Promise<StartServer> => {
  const { port, onServerCrash } = options;

  const server = createServer();
  const wss = new WebSocketServer({ server });
  const connectionHandler = new ConnectionHandler();

  wss.on("connection", (wsConn, request) => {
    const connectionName = getConnectionName(request.url || "");

    if (!connectionName) {
      serverLogger.error("WebSocket connection attempt failed", {
        context: "WebSocketServer",
        details: {
          reason: "Missing connection name in request URL",
          url: request.url,
          headers: request.headers,
        },
      });
      return;
    }

    connectionHandler.handleNewConnection(connectionName, wsConn);

    wsConn.on("error", (error) => {
      serverLogger.error("WebSocket connection error", {
        context: "WebSocketServer",
        details: {
          connectionName,
          error: error.message,
          stack: error.stack,
        },
      });
    });

    wsConn.on("close", () => {
      const closedConnectionName = getConnectionName(request.url || "");
      if (!closedConnectionName) {
        return;
      }
      connectionHandler.handleClosedConnection(closedConnectionName);
    });

    wsConn.on("message", (msg: MessageTypes) => {
      const message = JSON.parse(msg.toString()) as MessageTypes;
      serverLogger.info("Received message from devtools plugin", {
        context: "WebSocketServer",
        details: {
          connectionName,
          messageType: message.data.messageType,
        },
      });
      switch (message.data.messageType) {
        // Received info from connected plugin and informing devtools frontend
        case MessageType.PLUGIN_INITIALIZED: {
          connectionHandler.sendConnectedAppsInfoToDevtoolsFrontend(
            message.data.connectionName,
            message as DevtoolsClientHandshakeMessage,
          );
          return;
        }
        // Received info from devtools frontend that client apps have been created
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
          serverLogger.warning("Unhandled message type received", {
            context: "WebSocketServer",
            details: {
              messageType: message.data.messageType,
              connectionName: message.data.connectionName,
              fullMessage: message,
            },
          });
      }
    });
  });

  wss.on("error", (error) => {
    serverLogger.error("WebSocket server error", {
      context: "WebSocketServer",
      details: {
        error: error.message,
        stack: error.stack,
      },
    });
  });

  if (onServerCrash) {
    process.on("unhandledRejection", onServerCrash);
  }

  server
    .listen(port, () => {
      serverLogger.success("Application Server started", {
        context: "Server",
        details: {
          port,
          protocol: "http",
        },
      });
    })
    .on("close", () => {
      if (onServerCrash) {
        process.off("unhandledRejection", onServerCrash);
      }
      serverLogger.warning("Server closed", {
        context: "Server",
        details: {
          port,
          reason: "Server closed event triggered",
        },
      });
    })
    .on("error", (error) => {
      if (onServerCrash) {
        process.off("unhandledRejection", onServerCrash);
      }
      serverLogger.error("Server error occurred", {
        context: "Server",
        details: {
          port,
          error: error.message,
          stack: error.stack,
        },
      });
    });

  const startingServer = new Promise((resolve) => {
    server.on(`listening`, () => {
      resolve(true);
    });
  });

  const isReady = await startingServer;

  if (isReady) {
    return {
      server,
      wss,
      connections: connectionHandler.connections,
      DEVTOOLS_FRONTEND_WS_CONNECTION: connectionHandler.devtoolsFrontendConnection,
    };
  }
  serverLogger.error("Server failed to start", {
    context: "Server",
    details: {
      port,
      error: "Server failed to start",
    },
  });
  return { server: null, wss: null, connections: {}, DEVTOOLS_FRONTEND_WS_CONNECTION: null };
};
