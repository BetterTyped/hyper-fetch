import { createSocketClient, WebsocketAdapter } from "@hyper-fetch/sockets";

export type ChatMessage = { id: string; author: string; text: string; sentAt: number };

/**
 * A public echo server: it sends every frame straight back. A real chat server would forward it to everyone in the room.
 * The adapter sends `{ topic, data }` as JSON and routes incoming frames to listeners by their `topic`.
 */
export const socket = createSocketClient({
  url: "wss://ws.postman-echo.com/raw",
  adapter: WebsocketAdapter(),
  // Wait 2 seconds between reconnection attempts after the connection drops.
  reconnectTime: 2000,
});

export const onChatMessage = socket.createListener<ChatMessage>()({ topic: "chat-message" });

export const sendChatMessage = socket.createEmitter<ChatMessage>()({ topic: "chat-message" });
