import { Socket } from "@hyper-fetch/sockets";
import { MessageType } from "../../types/message.type";
import { SocketTopics } from "./topics";

export const socket = new Socket({ url: "ws://localhost:1234", autoConnect: false }).setDebug(true);

export const receiveData = socket.createListener<MessageType["data"]>()({
  topic: SocketTopics.FRONTEND_LISTENER_TOPIC,
});

export const sendCommand = socket.createEmitter<{ message: string; username: string; timestamp: string }>()({
  topic: SocketTopics.FRONTEND_EMITTER_TOPIC,
});
