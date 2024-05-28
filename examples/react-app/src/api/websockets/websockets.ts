import { socket } from "../client";

export const getMessage = socket.createListener<{
  response: { message: string; username: string; timestamp: string };
}>()({
  topic: "messages",
});

export const sendMessage = socket.createEmitter<{
  response: { message: string; username: string; timestamp: string };
  payload: { message: string };
}>()({
  topic: "chat-message",
});
