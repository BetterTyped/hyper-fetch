import type { BaseMessagePayload, MessageOrigin } from "@hyper-fetch/plugin-devtools";
import { serverLogger } from "@shared/utils/logger";
import type { IncomingMessage, Server } from "http";
import { createServer } from "http";
import type { RawData, WebSocket } from "ws";
import { WebSocketServer } from "ws";

import { ConnectionHandler } from "./handlers/connection-handler";
import type { ConnectionMap } from "./types/connection.type";

const getConnectionInfo = (request: IncomingMessage) => {
  const { searchParams } = new URL(`${request.url}`, "http://localhost");
  const connectionName = searchParams.get("connectionName");
  const origin = searchParams.get("origin") as MessageOrigin | null;
  if (!connectionName || !origin) {
    return null;
  }
  return { connectionName, origin };
};

type StartServerResult = {
  connections: ConnectionMap;
  /** The HyperFlow renderer connection at the moment of reading. */
  readonly DEVTOOLS_FRONTEND_WS_CONNECTION: WebSocket | null;
  /** The HyperFlow renderer connection, or `null` while the renderer is not connected. */
  getAppConnection: () => WebSocket | null;
};

/** A running server, or `null`s and the reason it could not listen */
export type StartServer =
  | (StartServerResult & { server: Server; wss: WebSocketServer; errorMessage?: undefined })
  | (StartServerResult & { server: null; wss: null; errorMessage: string });

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
    const connectionInfo = getConnectionInfo(request);

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
            // Only the runtime throws here, e.g. a payload too deep to serialize again
            error: String(error),
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

  // A port out of range throws instead of emitting "error"
  const listenError = await new Promise<NodeJS.ErrnoException | null>((resolve) => {
    server.once("listening", () => resolve(null));
    server.once("error", resolve);
    try {
      server.listen(port);
    } catch (error) {
      resolve(error as NodeJS.ErrnoException);
    }
  });

  if (!listenError) {
    serverLogger.success("Application Server started", { context: "Server", details: { port, protocol: "http" } });
    if (onServerCrash) {
      process.on("unhandledRejection", onServerCrash);
      server.once("close", () => process.off("unhandledRejection", onServerCrash));
    }
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
  const errorMessage =
    listenError.code === "EADDRINUSE" ? `Port ${port} is already in use` : `Error: ${listenError.message}`;
  serverLogger.error("Server failed to start", {
    context: "Server",
    details: { port, error: errorMessage },
  });
  return {
    server: null,
    wss: null,
    connections: {},
    DEVTOOLS_FRONTEND_WS_CONNECTION: null,
    getAppConnection: () => null,
    errorMessage,
  };
};
