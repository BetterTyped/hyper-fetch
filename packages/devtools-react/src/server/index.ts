import { createServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import url from "url";

import { SocketTopics } from "../sockets/topics";
import { MessageType, MessageTypes } from "../types/messages.types";
import { ConnectionName } from "../sockets/connection.name";

const port = 1234;
const server = createServer();
const wss = new WebSocketServer({ server });

let DEVTOOLS_WS_CONNECTION: WebSocket | null = null;

const sendHandshake = (connectionName: string) => {
  DEVTOOLS_WS_CONNECTION!.send(
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
const addConnection = (connectionName: string, connection: WebSocket) => {
  if (!connections[connectionName]) {
    connections[connectionName] = { ws: connection, handshake: "pending", events: [] };
  } else {
    connections[connectionName].ws = connection;
  }
  if (DEVTOOLS_WS_CONNECTION) {
    sendHandshake(connectionName);
    connections[connectionName].handshake = "sent";
  }
  // TODO handle disconnected etc.
};

const sendPendingHandshakes = () => {
  Object.keys(connections).forEach((connectionName) => {
    if (connections[connectionName].handshake === "pending") {
      sendHandshake(connectionName);
      connections[connectionName].handshake = "sent";
    }
  });
};

wss.on("connection", (wsConn, request) => {
  const queryParams = url.parse(request.url!, true).query;
  const { connectionName } = queryParams as { connectionName: string };
  console.log("CONNECTION NAME", connectionName);
  // TODO HANDLE REFRESHING CONNECTION AND HANGUP
  if (connectionName && connectionName === ConnectionName.HF_DEVTOOLS_APP) {
    console.log("CONNECTED TO DEVTOOLS FRONTEND");
    DEVTOOLS_WS_CONNECTION = wsConn;
    sendPendingHandshakes();
  }
  if (connectionName && !Array.isArray(connectionName) && connectionName.startsWith("HF_DEVTOOLS_CLIENT")) {
    // TODO handle connecting before frontend app
    addConnection(connectionName, wsConn);
  }
  wsConn.on("error", console.error);

  wsConn.on("message", (msg: MessageTypes) => {
    const message = JSON.parse(msg.toString()) as MessageTypes;
    console.log("RECEIVED MESSAGE", message);
    if (!DEVTOOLS_WS_CONNECTION) {
      // TODO handle
      console.error("FRONTEND CONNECTION NOT YET ESTABLISHED");
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
        console.log("ESTABLISHED CONNECTION", message.data.connectionName);
        if (!connections[message.data.connectionName]) {
          console.error(`CONNECTION ${message.data.connectionName} DOES NOT EXIST. HOW COULD THAT BE`);
        }
        connections[message.data.connectionName].handshake = "confirmed";
        const connectionEvents = connections[message.data.connectionName]?.events;

        while (connectionEvents && connectionEvents.length > 0 && DEVTOOLS_WS_CONNECTION) {
          console.log("SENDING STORED EVENTS");
          DEVTOOLS_WS_CONNECTION.send(connectionEvents.shift());
        }
        return;
      }
      case MessageType.HF_APP_EVENT: {
        console.log("HF APP EVENT RECEIVED");
        const conn = message.data.connectionName;
        if (connections[conn]?.handshake && DEVTOOLS_WS_CONNECTION) {
          console.log("SENDING HF EVENT", message);
          DEVTOOLS_WS_CONNECTION.send(JSON.stringify({ ...message, topic: SocketTopics.DEVTOOLS_APP_CLIENT_LISTENER }));
        } else {
          console.log("STORING EVENT");
          connections[conn].events.push(
            JSON.stringify({ ...message, topic: SocketTopics.DEVTOOLS_APP_CLIENT_LISTENER }),
          );
        }
        return;
      }
      default:
        console.log("UNHANDLED MESSSAGE TYPE", message);
    }
  });
});

server.listen(port, () => {
  console.log(`WebSocket server is running on port ${port}`);
});
