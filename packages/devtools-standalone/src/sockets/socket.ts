import { Socket } from "@hyper-fetch/sockets";
import { SocketTopics } from "./topics";
import { BaseMessage } from "../../types/messages.types";

export const initSocket = new Socket({ url: "ws://localhost:1234", autoConnect: false }).setDebug(true);

export const receiveMessage = initSocket.createListener<BaseMessage["data"]>()({
  topic: SocketTopics.DEVTOOLS_APP_MAIN_LISTENER,
});

export const sendMessage = initSocket.createEmitter<BaseMessage["data"]>()({
  topic: SocketTopics.DEVTOOLS_APP_MAIN_EMITTER,
});

export const clientSpecificReceiveMessage = initSocket.createListener<BaseMessage["data"]>()({
  topic: SocketTopics.DEVTOOLS_APP_CLIENT_LISTENER,
});
