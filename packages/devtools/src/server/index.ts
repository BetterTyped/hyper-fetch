import { createServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import url from "url";

import { SocketTopics } from "../sockets/topics";
import { MessageType, MessageTypes } from "../types/messages.types";
import { ConnectionName } from "../sockets/connection.name";

const sendHandshake = (devtoolsAppConnection: WebSocket, connectionName: string) => {
  devtoolsAppConnection.send(
    JSON.stringify({
      ...{
        topic: SocketTopics.DEVTOOLS_APP_MAIN_LISTENER,
        data: { messageType: MessageType.DEVTOOLS_CLIENT_INIT, connectionName },
      },
    }),
  );
};

// TODO - add heartbeat + cleanup of hangup connections.

const connections: Record<string, { ws: WebSocket; handshake: "pending" | "sent" | "confirmed"; events: any[] }> = {};
const addConnection = (devtoolsAppConnection: WebSocket | null, connectionName: string, connection: WebSocket) => {
  if (!connections[connectionName]) {
    connections[connectionName] = { ws: connection, handshake: "pending", events: [] };
  } else {
    connections[connectionName].ws = connection;
  }
  if (devtoolsAppConnection) {
    sendHandshake(devtoolsAppConnection, connectionName);
    connections[connectionName].handshake = "sent";
  }
};

const sendPendingHandshakes = (devtoolsAppConnection: WebSocket) => {
  Object.keys(connections).forEach((connectionName) => {
    if (connections[connectionName].handshake === "pending") {
      sendHandshake(devtoolsAppConnection, connectionName);
      connections[connectionName].handshake = "sent";
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
    const queryParams = url.parse(request.url!, true).query;
    const { connectionName } = queryParams as { connectionName: string };
    if (!connectionName) {
      console.error("MISSING CONNECTION NAME", request.url);
      return;
    }
    // TODO HANDLE REFRESHING CONNECTION AND HANGUP
    if (connectionName && connectionName === ConnectionName.HF_DEVTOOLS_APP) {
      DEVTOOLS_FRONTEND_WS_CONNECTION = wsConn;
      sendPendingHandshakes(DEVTOOLS_FRONTEND_WS_CONNECTION);
    }
    if (connectionName && !Array.isArray(connectionName) && connectionName.startsWith("HF_DEVTOOLS_CLIENT")) {
      addConnection(DEVTOOLS_FRONTEND_WS_CONNECTION, connectionName, wsConn);
    }
    wsConn.on("error", console.error);

    wsConn.on("message", (msg: MessageTypes) => {
      const message = JSON.parse(msg.toString()) as MessageTypes;
      if (!DEVTOOLS_FRONTEND_WS_CONNECTION) {
        console.error("FRONTEND CONNECTION NOT YET ESTABLISHED");
        return;
      }

      switch (message.data.messageType) {
        case MessageType.HF_DEVTOOLS_EVENT: {
          const { connectionName } = message.data;
          console.log("RECEIVED EVENT FROM DEVTOOLS", message);
          if (connections[connectionName]) {
            connections[connectionName].ws.send(
              JSON.stringify({ ...message, topic: SocketTopics.DEVTOOLS_PLUGIN_LISTENER }),
            );
          }
          return;
        }
        case MessageType.DEVTOOLS_CLIENT_CONFIRM: {
          if (!connections[message.data.connectionName]) {
            console.error(`CONNECTION ${message.data.connectionName} DOES NOT EXIST`);
            return;
          }

          connections[message.data.connectionName].handshake = "confirmed";
          const connectionEvents = connections[message.data.connectionName]?.events;
          sendStoredEvents(DEVTOOLS_FRONTEND_WS_CONNECTION, connectionEvents);

          return;
        }
        case MessageType.HF_APP_EVENT: {
          const conn = message.data.connectionName;
          if (connections[conn]?.handshake && DEVTOOLS_FRONTEND_WS_CONNECTION) {
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
          console.log("UNHANDLED MESSSAGE TYPE", message);
          return;
      }
    });
  });

  wss.on("error", console.error);

  server.listen(port, () => {
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
