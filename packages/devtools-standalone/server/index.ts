import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import url from "url";
import { SocketTopics } from "../src/sockets/topics";

const port = 1234;
const server = createServer();
const wss = new WebSocketServer({ server });

// TODO - add heartbeat + cleanup of hangup connections.

let FRONTEND_WS_CONNECTION: WebSocket | null = null;
// const connections: Record<string, WebSocket[]> = {};
// const manageConnection = (connectionName: string, connection: WebSocket) => {
//   if (!connections[connectionName]) {
//     connections[connectionName] = [connection];
//   }
//   if (connections[connectionName]) {
//     console.log("Connection with the same connectionName already exists. Please ensure that this is correct behaviour");
//     connections[connectionName].push(connection);
//   }
// };

wss.on("connection", function connection(conn, request) {
  const { connectionName } = url.parse(request.url!, true).query;
  console.log("CONNECTION NAME", connectionName);
  if (connectionName && connectionName === "HF_DEVTOOLS_APP") {
    console.log("CONNECTED TO DEVTOOLS FRONTEND");
    FRONTEND_WS_CONNECTION = conn;
  }
  if (connectionName && !Array.isArray(connectionName) && connectionName.startsWith("HF_DEVTOOLS_CLIENT")) {
  }
  conn.on("error", console.error);

  conn.on("message", function message(data: any) {
    console.log(`Received message`);
    if (FRONTEND_WS_CONNECTION) {
      const value = JSON.parse(data.toString());
      console.log("SENDING MESSAGE", value);
      FRONTEND_WS_CONNECTION.send(JSON.stringify({ ...value, topic: SocketTopics.FRONTEND_LISTENER_TOPIC }));
    }
  });
});

server.listen(port, () => {
  console.log(`WebSocket server is running on port ${port}`);
});
