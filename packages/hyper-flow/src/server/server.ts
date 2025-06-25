import { createServer, Server } from "http";
import { WebSocket, WebSocketServer } from "ws";
import url from "url";
import { BaseMessagePayload, MessageOrigin } from "@hyper-fetch/plugin-devtools";
import { serverLogger } from "@shared/utils/logger";

import { ConnectionHandler } from "./handlers/connection-handler";

const getConnectionInfo = (requestUrl: string) => {
  const queryParams = url.parse(requestUrl, true).query;
  const { connectionName, origin } = (queryParams || {}) as { connectionName?: string; origin?: MessageOrigin };
  if (!connectionName || !origin) {
    return null;
  }
  return { connectionName, origin };
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
    const connectionInfo = getConnectionInfo(request.url || "");

    if (!connectionInfo) {
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

    connectionHandler.handleNewConnection(connectionInfo, wsConn);

    wsConn.on("error", (error) => {
      serverLogger.error("WebSocket connection error", {
        context: "WebSocketServer",
        details: {
          connectionInfo,
          error: error.message,
          stack: error.stack,
        },
      });
    });

    wsConn.on("close", () => {
      if (!connectionInfo) {
        return;
      }
      connectionHandler.handleClosedConnection(connectionInfo.connectionName);
    });

    wsConn.on("message", (msg: { data: BaseMessagePayload }) => {
      const message = JSON.parse(msg.toString()) as { data: BaseMessagePayload };
      connectionHandler.handleMessage(message);
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
      connections: connectionHandler.connectionState.connections,
      DEVTOOLS_FRONTEND_WS_CONNECTION: connectionHandler.connectionState.appConnection,
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
