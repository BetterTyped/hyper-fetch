import type { DevtoolsSocketEventData, DevtoolsSocketStatus } from "@hyper-fetch/plugin-devtools";
import { SocketEvents } from "@hyper-fetch/plugin-devtools";
import { create } from "zustand/react";

/** Messages kept per application, the oldest are dropped */
export const MAX_SOCKET_MESSAGES = 1000;

export type SocketMessageKind = "received" | "sent" | "failed" | "connection" | "error";

export type SocketMessage = {
  /** Increasing per application, newer messages have higher ids */
  id: number;
  socketId: string;
  kind: SocketMessageKind;
  event: SocketEvents;
  topic: string | null;
  data: unknown;
  extra: unknown;
  error: unknown;
  attempts: number | null;
  timestamp: number;
  /** Bytes of the data as JSON, `0` for connection events */
  size: number;
};

export type SocketTopicStats = { received: number; sent: number; lastAt: number };

export type InspectedSocket = {
  id: string;
  url: string;
  adapterName: string;
  status: DevtoolsSocketStatus;
  reconnectAttempts: number;
  connectedAt: number | null;
  lastActivity: number | null;
  received: number;
  sent: number;
  failed: number;
  errors: number;
  bytesReceived: number;
  bytesSent: number;
  topics: Record<string, SocketTopicStats>;
};

export type SocketsFilter = "all" | "received" | "sent" | "connection";

export type ApplicationSockets = {
  sockets: Record<string, InspectedSocket>;
  /** Newest first */
  messages: SocketMessage[];
  nextMessageId: number;
  /** Shows the messages of one socket, `null` for all of them */
  selectedSocketId: string | null;
  detailsMessageId: number | null;
  searchTerm: string;
  filter: SocketsFilter;
};

const getInitialState = (): ApplicationSockets => ({
  sockets: {},
  messages: [],
  nextMessageId: 1,
  selectedSocketId: null,
  detailsMessageId: null,
  searchTerm: "",
  filter: "all",
});

/** Bytes of a message as it would travel as JSON */
export const getMessageSize = (data: unknown): number => {
  if (data === undefined || data === null) {
    return 0;
  }
  // Messages reach HyperFlow as JSON, so they always serialize again
  return new Blob([typeof data === "string" ? data : JSON.stringify(data)]).size;
};

const getKind = (event: SocketEvents): SocketMessageKind => {
  switch (event) {
    case SocketEvents.MESSAGE_RECEIVED:
      return "received";
    case SocketEvents.MESSAGE_SENT:
      return "sent";
    case SocketEvents.MESSAGE_FAILED:
      return "failed";
    case SocketEvents.ERROR:
      return "error";
    default:
      return "connection";
  }
};

const createSocket = (data: DevtoolsSocketEventData): InspectedSocket => ({
  id: data.socketId,
  url: data.url,
  adapterName: data.adapterName,
  status: data.status ?? "disconnected",
  reconnectAttempts: 0,
  connectedAt: null,
  lastActivity: null,
  received: 0,
  sent: 0,
  failed: 0,
  errors: 0,
  bytesReceived: 0,
  bytesSent: 0,
  topics: {},
});

const countTopic = ({
  topics,
  topic,
  direction,
  timestamp,
}: {
  topics: InspectedSocket["topics"];
  topic: string | undefined;
  direction: "received" | "sent";
  timestamp: number;
}) => {
  if (!topic) {
    return topics;
  }
  const current = topics[topic] ?? { received: 0, sent: 0, lastAt: timestamp };
  return { ...topics, [topic]: { ...current, [direction]: current[direction] + 1, lastAt: timestamp } };
};

/** The 1-based number of the reconnection attempt an event announces */
const getAttemptNumber = (data: DevtoolsSocketEventData, socket: InspectedSocket) =>
  data.attempts === undefined ? socket.reconnectAttempts + 1 : data.attempts + 1;

/** The socket after an event of the plugin */
export const applySocketEvent = ({
  socket,
  event,
  data,
  size,
}: {
  socket: InspectedSocket;
  event: SocketEvents;
  data: DevtoolsSocketEventData;
  size: number;
}): InspectedSocket => {
  const { timestamp } = data;
  switch (event) {
    case SocketEvents.REGISTERED: {
      const status = data.status ?? socket.status;
      return {
        ...socket,
        url: data.url,
        adapterName: data.adapterName,
        status,
        connectedAt: status === "connected" ? (socket.connectedAt ?? timestamp) : socket.connectedAt,
      };
    }
    case SocketEvents.CONNECTING:
      return { ...socket, status: socket.status === "reconnecting" ? "reconnecting" : "connecting" };
    case SocketEvents.CONNECTED:
      return { ...socket, status: "connected", connectedAt: timestamp, reconnectAttempts: 0, lastActivity: timestamp };
    case SocketEvents.DISCONNECTED:
      return { ...socket, status: "disconnected", connectedAt: null };
    // Sockets report the attempts made before this one, so the first reconnection comes with 0
    case SocketEvents.RECONNECTING:
      return { ...socket, status: "reconnecting", reconnectAttempts: getAttemptNumber(data, socket) };
    case SocketEvents.RECONNECT_FAILED:
      return { ...socket, status: "failed", reconnectAttempts: data.attempts ?? socket.reconnectAttempts };
    case SocketEvents.ERROR:
      return { ...socket, errors: socket.errors + 1, lastActivity: timestamp };
    case SocketEvents.MESSAGE_RECEIVED:
      return {
        ...socket,
        received: socket.received + 1,
        bytesReceived: socket.bytesReceived + size,
        lastActivity: timestamp,
        topics: countTopic({ topics: socket.topics, topic: data.topic, direction: "received", timestamp }),
      };
    case SocketEvents.MESSAGE_SENT:
      return {
        ...socket,
        sent: socket.sent + 1,
        bytesSent: socket.bytesSent + size,
        lastActivity: timestamp,
        topics: countTopic({ topics: socket.topics, topic: data.topic, direction: "sent", timestamp }),
      };
    case SocketEvents.MESSAGE_FAILED:
      return { ...socket, failed: socket.failed + 1, lastActivity: timestamp };
    default:
      return socket;
  }
};

type SocketsStore = {
  applications: { [application: string]: ApplicationSockets };
  initialize: (application: string) => void;
  /** Record an event the devtools plugin reported for one of the application's sockets */
  handleEvent: (application: string, event: SocketEvents, data: DevtoolsSocketEventData) => void;
  selectSocket: (application: string, socketId: string | null) => void;
  openDetails: (application: string, messageId: number) => void;
  closeDetails: (application: string) => void;
  setSearchTerm: (application: string, searchTerm: string) => void;
  setFilter: (application: string, filter: SocketsFilter) => void;
  clearMessages: (application: string) => void;
};

export const useSocketsStore = create<SocketsStore>((set) => {
  // Sockets can stream many messages per second, so updates copy only what changed (see the network store)
  const updateApplication = (application: string, update: (app: ApplicationSockets) => ApplicationSockets) => {
    // Every update changes something, and events can come before a reloaded renderer set the application up
    set((state) => ({
      applications: {
        ...state.applications,
        [application]: update(state.applications[application] ?? getInitialState()),
      },
    }));
  };

  return {
    applications: {},
    initialize: (application) => {
      set((state) => ({ applications: { ...state.applications, [application]: getInitialState() } }));
    },
    handleEvent: (application, event, data) => {
      if (!data?.socketId) {
        return;
      }
      updateApplication(application, (app) => {
        const kind = getKind(event);
        const carriesData = kind === "received" || kind === "sent" || kind === "failed";
        const size = carriesData ? getMessageSize(data.data) : 0;
        const socket = applySocketEvent({
          socket: app.sockets[data.socketId] ?? createSocket(data),
          event,
          data,
          size,
        });
        const sockets = { ...app.sockets, [data.socketId]: socket };

        // A registration only describes the socket, it is not something that happened to it
        if (event === SocketEvents.REGISTERED) {
          return { ...app, sockets };
        }

        const message: SocketMessage = {
          id: app.nextMessageId,
          socketId: data.socketId,
          kind,
          event,
          topic: data.topic ?? null,
          data: data.data,
          extra: data.extra,
          error: data.error,
          // Shown as "attempt N", so a reconnection gets its 1-based number
          attempts: event === SocketEvents.RECONNECTING ? socket.reconnectAttempts : (data.attempts ?? null),
          timestamp: data.timestamp,
          size,
        };
        return {
          ...app,
          sockets,
          messages: [message, ...app.messages].slice(0, MAX_SOCKET_MESSAGES),
          nextMessageId: app.nextMessageId + 1,
        };
      });
    },
    selectSocket: (application, socketId) => {
      updateApplication(application, (app) => ({ ...app, selectedSocketId: socketId, detailsMessageId: null }));
    },
    openDetails: (application, messageId) => {
      updateApplication(application, (app) => ({ ...app, detailsMessageId: messageId }));
    },
    closeDetails: (application) => {
      updateApplication(application, (app) => ({ ...app, detailsMessageId: null }));
    },
    setSearchTerm: (application, searchTerm) => {
      updateApplication(application, (app) => ({ ...app, searchTerm }));
    },
    setFilter: (application, filter) => {
      updateApplication(application, (app) => ({ ...app, filter }));
    },
    clearMessages: (application) => {
      updateApplication(application, (app) => ({ ...app, messages: [], detailsMessageId: null }));
    },
  };
});
