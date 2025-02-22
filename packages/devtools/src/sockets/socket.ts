import { Socket } from "@hyper-fetch/sockets";

import { SocketTopics } from "./topics";
import { BaseMessage } from "../types/messages.types";
import { ConnectionName } from "./connection.name";

export const initializeSocket = ({ socketAddress, socketPort } = { socketAddress: "localhost", socketPort: 1234 }) => {
  const socket = new Socket({ url: `ws://${socketAddress}:${socketPort}`, adapterOptions: { autoConnect: false } })
    .onConnected(console.log)
    .onDisconnected(console.log)
    .onError(console.log)
    .setQueryParams({ connectionName: ConnectionName.HF_DEVTOOLS_APP })
    .setDebug(true);

  console.log(socket);

  const devtoolsListener = socket.createListener<BaseMessage["data"]>()({
    topic: SocketTopics.DEVTOOLS_APP_MAIN_LISTENER,
  });

  const clientSpecificReceiveMessage = socket.createListener<BaseMessage["data"]>()({
    topic: SocketTopics.DEVTOOLS_APP_CLIENT_LISTENER,
  });

  const clientSpecificSendMessage = socket.createEmitter<BaseMessage["data"]>()({
    topic: SocketTopics.DEVTOOLS_APP_CLIENT_EMITTER,
  });

  // TODO - handle waiting/connection?
  socket.connect();

  return { devtoolsListener, clientSpecificReceiveMessage, clientSpecificSendMessage };
};
