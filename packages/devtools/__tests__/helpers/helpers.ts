import { Client } from "@hyper-fetch/core";
import { devtoolsPlugin } from "@hyper-fetch/devtools-plugin";
import { Socket } from "@hyper-fetch/sockets";
import { ConnectionName } from "sockets/connection.name";

export const connectDevtoolsClient = ({
  baseUrl = "http://localhost:1234",
  clientName = "test-client",
  socketAddress = "ws:localhost",
  socketPort = 1234,
}: {
  baseUrl?: string;
  clientName?: string;
  socketAddress?: string;
  socketPort?: number;
} = {}) => {
  const client = new Client({ url: baseUrl });

  const devtools = devtoolsPlugin({
    appName: clientName,
    socketAddress,
    socketPort,
  });

  client.addPlugin(devtools);

  return client;
};

export const connectDevtoolsFrontend = async ({
  socketAddress = "localhost",
  socketPort = 1234,
}: {
  socketAddress?: string;
  socketPort?: number;
}) => {
  const initSocket = new Socket({
    url: `ws://${socketAddress}:${socketPort}`,
    adapterOptions: { autoConnect: false },
  }).setDebug(true);
  const socketConnected = initSocket.setQueryParams({ connectionName: ConnectionName.HF_DEVTOOLS_APP });

  await socketConnected.connect();
};

export const listenForServerMessage = async (wss: any) => {
  return new Promise((resolve) => {
    wss.on("connection", (wsConn, request) => {
      console.log("CONNECTION LISTEN FOR SERVER", request.url);
      wsConn.on("message", (message) => {
        console.log("CONNECTION LISTEN FOR SERVER MESSAGE", request.url);
        console.log("MESSAGE", message);
        return resolve(message);
      });
    });
  });
};

export const listenForSocketMessage = async (socket: Socket) => {
  return new Promise((resolve) => {
    socket.onMessage((message) => {
      console.log("SOCKET MESSAGE", message);
      return resolve(message);
    });
  });
};
