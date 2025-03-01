import { createServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import url from "url";

import { MessageType, MessageTypes } from "../types/messages.types";
import { ConnectionName } from "../frontend/constants/connection.name";
import { SocketTopics } from "frontend/lib/socket/topics";

// TODO - handle message with info about lostConnection for a given app when connection is lost on frontend side.

const initializeFrontendForConnection = (devtoolsAppConnection: WebSocket, connectionName: string) => {
  devtoolsAppConnection?.send(
    JSON.stringify({
      ...{
        topic: SocketTopics.DEVTOOLS_APP_MAIN_LISTENER,
        data: { messageType: MessageType.DEVTOOLS_CLIENT_INIT, connectionName },
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
  string,
  {
    ws: WebSocket | null;
    frontendStatus: "pending" | "sent" | "initialized";
    events: any[];
    status: "connected" | "hangup";
  }
> = {};
const addConnection = (devtoolsAppConnection: WebSocket | null, connectionName: string, connection: WebSocket) => {
  if (!connections[connectionName]) {
    connections[connectionName] = { ws: connection, frontendStatus: "pending", events: [], status: "connected" };
  } else {
    connections[connectionName].ws = connection;
  }
  if (devtoolsAppConnection) {
    initializeFrontendForConnection(devtoolsAppConnection, connectionName);
    connections[connectionName].frontendStatus = "sent";
  }
};

const initializePendingFrontends = (devtoolsAppConnection: WebSocket) => {
  Object.keys(connections).forEach((connectionName) => {
    if (connections[connectionName].frontendStatus === "pending") {
      initializeFrontendForConnection(devtoolsAppConnection, connectionName);
      connections[connectionName].frontendStatus = "sent";
    }
  });
};

const sendStoredEvents = (devtoolsAppConnection: WebSocket | null, events: any[]) => {
  while (events && events.length > 0 && devtoolsAppConnection) {
    devtoolsAppConnection.send(events.shift());
  }
};

export const startServer = async (port = 1234) => {
  const server = createServer();
  const wss = new WebSocketServer({ server });
  let DEVTOOLS_FRONTEND_WS_CONNECTION: WebSocket | null = null;

  wss.on("connection", (wsConn, request) => {
    const connectionName = getConnectionName(request.url || "");
    if (!connectionName) {
      console.error("MISSING CONNECTION NAME", request.url);
      return;
    }
    if (connectionName && connectionName === ConnectionName.HF_DEVTOOLS_APP) {
      DEVTOOLS_FRONTEND_WS_CONNECTION = wsConn;
      initializePendingFrontends(DEVTOOLS_FRONTEND_WS_CONNECTION);
    }
    if (connectionName && !Array.isArray(connectionName) && connectionName.startsWith("HF_DEVTOOLS_CLIENT")) {
      addConnection(DEVTOOLS_FRONTEND_WS_CONNECTION, connectionName, wsConn);
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
        case MessageType.HF_DEVTOOLS_EVENT: {
          const ws = connections[message.data.connectionName]?.ws;
          if (ws?.send) {
            ws.send(JSON.stringify({ ...message, topic: SocketTopics.DEVTOOLS_PLUGIN_LISTENER }));
          }
          return;
        }
        case MessageType.DEVTOOLS_CLIENT_CONFIRM: {
          if (!connections[message.data.connectionName]) {
            console.error(`CONNECTION ${message.data.connectionName} DOES NOT EXIST`);
            return;
          }

          connections[message.data.connectionName].frontendStatus = "initialized";
          const connectionEvents = connections[message.data.connectionName]?.events;
          sendStoredEvents(DEVTOOLS_FRONTEND_WS_CONNECTION, connectionEvents);

          return;
        }
        case MessageType.HF_APP_EVENT: {
          const conn = message.data.connectionName;
          if (connections[conn]?.frontendStatus && DEVTOOLS_FRONTEND_WS_CONNECTION) {
            DEVTOOLS_FRONTEND_WS_CONNECTION.send(
              JSON.stringify({ ...message, topic: SocketTopics.DEVTOOLS_APP_CLIENT_LISTENER }),
            );
          } else {
            connections[conn].events.push(
              JSON.stringify({ ...message, topic: SocketTopics.DEVTOOLS_APP_CLIENT_LISTENER }),
            );
          }
          return;
        }
        default:
          console.error("UNHANDLED MESSSAGE TYPE", message);
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
  return {};
};
