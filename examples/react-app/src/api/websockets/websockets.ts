import { socket } from "../client";

export const getMessage = socket.createListener<{ message: string; username: string; timestamp: string }>()({
  topic: "messages",
});

export const sendMessage = socket.createEmitter<{ message: string; username: string; timestamp: string }>()({
  topic: "chat-message",
});
