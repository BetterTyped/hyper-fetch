import type { BaseMessagePayload, MessageOrigin } from "@hyper-fetch/plugin-devtools";
import { serverLogger } from "@shared/utils/logger";
import type { Server } from "http";
import { createServer } from "http";
import url from "url";
import type { RawData, WebSocket } from "ws";
import { WebSocketServer } from "ws";

import { ConnectionHandler } from "./handlers/connection-handler";
import type { ConnectionMap } from "./types/connection.type";

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
  connections: ConnectionMap;
  /** The HyperFlow renderer connection at the moment of reading. */
  readonly DEVTOOLS_FRONTEND_WS_CONNECTION: WebSocket | null;
  /** The HyperFlow renderer connection, or `null` while the renderer is not connected. */
  getAppConnection: () => WebSocket | null;
  errorMessage?: string;
};

const parseMessage = (raw: RawData): { data: BaseMessagePayload } | null => {
  try {
    const message = JSON.parse(raw.toString()) as { data?: BaseMessagePayload } | null;
    if (!message || typeof message !== "object" || !message.data || typeof message.data !== "object") {
      return null;
    }
    return message as { data: BaseMessagePayload };
  } catch {
    return null;
  }
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
      wsConn.close(1008, "Missing connectionName or origin");
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
      connectionHandler.handleClosedConnection(connectionInfo, wsConn);
    });

    wsConn.on("message", (raw: RawData) => {
      const message = parseMessage(raw);
      if (!message) {
        serverLogger.error("Dropped malformed WebSocket message", {
          context: "WebSocketServer",
          details: { connectionInfo },
        });
        return;
      }
      // A listener that throws would surface as an uncaught exception in the Electron main process
      try {
        connectionHandler.handleMessage(message);
      } catch (error) {
        serverLogger.error("Failed to handle WebSocket message", {
          context: "WebSocketServer",
          details: {
            connectionInfo,
            error: error instanceof Error ? error.message : String(error),
            messageType: message.data.messageType,
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

  const startingServer = new Promise<{ isReady: boolean; message?: string }>((resolve) => {
    server.on(`listening`, () => {
      resolve({ isReady: true });
    });
    server.on("error", (err: { code: string }) => {
      if (err.code === "EADDRINUSE") {
        return resolve({ isReady: false, message: `Port ${port} is already in use` });
      }
      return resolve({ isReady: false, message: `Error: ${err.code}` });
    });
  });

  const { isReady, message } = await startingServer;

  if (isReady) {
    const getAppConnection = () => connectionHandler.connectionState.appConnection;
    return {
      server,
      wss,
      connections: connectionHandler.connectionState.connections,
      get DEVTOOLS_FRONTEND_WS_CONNECTION() {
        return getAppConnection();
      },
      getAppConnection,
    };
  }
  serverLogger.error("Server failed to start", {
    context: "Server",
    details: {
      port,
      error: "Server failed to start",
    },
  });
  return {
    server: null,
    wss: null,
    connections: {},
    DEVTOOLS_FRONTEND_WS_CONNECTION: null,
    getAppConnection: () => null,
    errorMessage: message,
  };
};
