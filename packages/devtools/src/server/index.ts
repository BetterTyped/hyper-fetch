import { createServer, Server } from "http";
import { WebSocket, WebSocketServer } from "ws";
import url from "url";

import { MessageType, MessageTypes } from "../types/messages.types";
import { ConnectionName } from "../frontend/constants/connection.name";
import { SocketTopics } from "frontend/constants/topics";

// TODO -

const initializeFrontendForConnection = (
  devtoolsAppConnection: WebSocket,
  connectionName: string,
  message: Record<any, any>,
) => {
  devtoolsAppConnection?.send(
    JSON.stringify({
      ...{
        topic: SocketTopics.DEVTOOLS_APP_MAIN_LISTENER,
        data: { messageType: MessageType.DEVTOOLS_CLIENT_INIT, connectionName, eventData: message.data.eventData },
      },
    }),
  );
};

const getConnectionName = (requestUrl: string) => {
  const queryParams = url.parse(requestUrl, true).query;
  const { connectionName } = (queryParams || {}) as { connectionName: string };
  return connectionName;
};

const connections: Record<
  string, // connectionName
  {
    ws: WebSocket | null;
    frontendStatus: "pending" | "sent" | "initialized";
    // TODO - buffer events if connection to frontend or backend somehow lost
    events?: any[];
    status: "connected" | "hangup";
    clientMetaData?: any;
  }
> = {};

const addConnection = (connectionName: string, connection: WebSocket) => {
  if (!connections[connectionName]) {
    connections[connectionName] = { ws: connection, frontendStatus: "pending", status: "connected" };
  } else {
    connections[connectionName].ws = connection;
  }
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
  let DEVTOOLS_FRONTEND_WS_CONNECTION: WebSocket | null = null;

  wss.on("connection", (wsConn, request) => {
    const connectionName = getConnectionName(request.url || "");

    if (!connectionName) {
      console.error("MISSING CONNECTION NAME", request.url);
      return;
    }
    if (connectionName && !Array.isArray(connectionName) && connectionName.startsWith("HF_DEVTOOLS_CLIENT")) {
      addConnection(connectionName, wsConn);
    }

    if (connectionName && connectionName === ConnectionName.HF_DEVTOOLS_APP) {
      DEVTOOLS_FRONTEND_WS_CONNECTION = wsConn;
      if (Object.keys(connections).length !== 0) {
        Object.entries(connections).forEach(([connectionName, connectionData]) => {
          initializeFrontendForConnection(
            DEVTOOLS_FRONTEND_WS_CONNECTION!,
            connectionName,
            connectionData.clientMetaData,
          );
        });
      }
    }

    wsConn.on("error", console.error);
    wsConn.on("close", () => {
      const closedConnectionName = getConnectionName(request.url || "");
      if (!closedConnectionName) {
        return;
      }
      if (closedConnectionName === ConnectionName.HF_DEVTOOLS_APP) {
        DEVTOOLS_FRONTEND_WS_CONNECTION = null;
      }
      if (connections[connectionName]) {
        const hangupConnection = connections[connectionName];
        hangupConnection.ws = null;
        hangupConnection.status = "hangup";
        if (!DEVTOOLS_FRONTEND_WS_CONNECTION) {
          console.error(`Something went wrong. Connection to devtools frontend and devtools plugin lost.`);
          return;
        }
        DEVTOOLS_FRONTEND_WS_CONNECTION.send(
          JSON.stringify({
            ...{
              topic: SocketTopics.DEVTOOLS_APP_MAIN_LISTENER,
              data: { messageType: MessageType.DEVTOOLS_CLIENT_HANGUP, connectionName },
            },
          }),
        );
      }
    });
    wsConn.on("message", (msg: MessageTypes) => {
      const message = JSON.parse(msg.toString()) as MessageTypes;
      if (!DEVTOOLS_FRONTEND_WS_CONNECTION) {
        console.error("FRONTEND CONNECTION NOT YET ESTABLISHED");
        return;
      }

      switch (message.data.messageType) {
        case MessageType.PLUGIN_INITIALIZED: {
          if (connections[message.data.connectionName]) {
            initializeFrontendForConnection(DEVTOOLS_FRONTEND_WS_CONNECTION, message.data.connectionName, message);
            connections[message.data.connectionName].frontendStatus = "sent";
            connections[message.data.connectionName].clientMetaData = message;
          }
          return;
        }
        case MessageType.DEVTOOLS_CLIENT_CONFIRM: {
          if (!connections[message.data.connectionName]) {
            console.error(`CONNECTION ${message.data.connectionName} DOES NOT EXIST`);
            return;
          }
          const ws = connections[message.data.connectionName]?.ws;
          ws!.send(
            JSON.stringify({
              data: { messageType: "CLIENT_INITIALIZED" },
              topic: SocketTopics.DEVTOOLS_PLUGIN_LISTENER,
            }),
          );
          connections[message.data.connectionName].frontendStatus = "initialized";
          return;
        }
        case MessageType.HF_DEVTOOLS_EVENT: {
          const ws = connections[message.data.connectionName]?.ws;
          if (ws?.send) {
            ws.send(JSON.stringify({ ...message, topic: SocketTopics.DEVTOOLS_PLUGIN_LISTENER }));
          }
          return;
        }
        case MessageType.HF_APP_EVENT: {
          const conn = message.data.connectionName;
          if (connections[conn]?.frontendStatus && DEVTOOLS_FRONTEND_WS_CONNECTION) {
            DEVTOOLS_FRONTEND_WS_CONNECTION.send(
              JSON.stringify({ ...message, topic: SocketTopics.DEVTOOLS_APP_CLIENT_LISTENER }),
            );
          } else {
            console.error(
              `Something went wrong while handling HF_APP_EVENT - DEVTOOLS_FRONTEND_CONNECTION - ${DEVTOOLS_FRONTEND_WS_CONNECTION}`,
            );
          }
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
    return { server, wss, connections, DEVTOOLS_FRONTEND_WS_CONNECTION };
  }
  return { server: null, wss: null, connections: {}, DEVTOOLS_FRONTEND_WS_CONNECTION: null };
};
