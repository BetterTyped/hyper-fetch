import { ServerSentEventsAdapter, Socket } from "@hyper-fetch/sockets";
import type { SocketInstance } from "@hyper-fetch/sockets";
import { createSseE2EServer, createWebsocketE2EServer } from "@hyper-fetch/testing";
import { EventSource as NodeEventSource } from "eventsource";

/**
 * One socket adapter as HyperFlow meets it, with a real server behind it.
 * Every socket compatibility spec runs once per entry.
 */
export type SocketCase = {
  name: string;
  /** `adapter.name` HyperFlow should present */
  adapterName: string;
  /** Whether the transport can send, SSE only receives */
  canSend: boolean;
  /**
   * Whether a dropped connection comes back by itself. An EventSource resumes its stream (keeping `Last-Event-ID`),
   * a WebSocket is reconnected by the socket, attempt by attempt.
   */
  resumesItself: boolean;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  /** A new socket of this kind, not connected yet */
  createSocket: (options?: { reconnect?: number; reconnectTime?: number }) => SocketInstance;
  /** Server pushes a message to every connected socket */
  push: (topic: string, data: unknown) => void;
  /** Server drops every connection */
  dropConnections: () => void;
  getUrl: () => string;
};

const createWebsocketCase = (): SocketCase => {
  const server = createWebsocketE2EServer();
  let url = "";
  return {
    name: "websockets",
    adapterName: "websockets",
    canSend: true,
    resumesItself: false,
    start: async () => {
      url = await server.startServer();
    },
    stop: () => server.stopServer(),
    createSocket: ({ reconnect = 0, reconnectTime = 50 } = {}) =>
      new Socket({ url, reconnect, reconnectTime, adapterOptions: { autoConnect: false } }),
    push: (topic, data) => server.sendToAll(topic, data),
    dropConnections: () => server.terminateAllClients(),
    getUrl: () => url,
  };
};

const createSseCase = (): SocketCase => {
  // A dropped stream is resumed after this delay, like a server that sends `retry:`
  const server = createSseE2EServer({ retry: 20 });
  let url = "";
  return {
    name: "sse",
    adapterName: "sse",
    canSend: false,
    resumesItself: true,
    start: async () => {
      url = await server.startServer();
    },
    stop: () => server.stopServer(),
    createSocket: ({ reconnect = 0, reconnectTime = 50 } = {}) =>
      new Socket({
        url,
        reconnect,
        reconnectTime,
        adapter: ServerSentEventsAdapter(),
        // jsdom has no EventSource
        adapterOptions: { autoConnect: false, EventSource: NodeEventSource as unknown as typeof EventSource },
      }) as unknown as SocketInstance,
    push: (topic, data) => server.sendEvent(topic, data),
    dropConnections: () => server.closeAllClients(),
    getUrl: () => url,
  };
};

export const socketCases: SocketCase[] = [createWebsocketCase(), createSseCase()];
