import type { SocketInstance } from "@hyper-fetch/sockets";

import type { DevtoolsSocketEventData, DevtoolsSocketStatus } from "./types/events.types";
import { SocketEvents } from "./types/events.types";

type Report = (eventName: SocketEvents, data: DevtoolsSocketEventData) => void;

/** Errors don't survive JSON, so they travel as their name and message */
const toTransferableError = (error: unknown) => {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }
  if (typeof Event !== "undefined" && error instanceof Event) {
    return { name: "Event", message: error.type };
  }
  return error;
};

const getStatus = (socket: SocketInstance): DevtoolsSocketStatus => {
  if (socket.adapter.connected) {
    return "connected";
  }
  return socket.adapter.connecting ? "connecting" : "disconnected";
};

/**
 * Reports what happens to one socket: its connection, the messages it receives and sends, and its errors.
 * Returns the snapshot to send whenever HyperFlow connects, and the cleanup.
 */
export const createSocketReporter = ({
  socket,
  socketId,
  report,
}: {
  socket: SocketInstance;
  socketId: string;
  report: Report;
}) => {
  const base = () => ({ socketId, url: socket.url, adapterName: socket.adapter.name, timestamp: Date.now() });

  const unmounts = [
    socket.events.onConnecting(({ connecting }) => {
      if (connecting) {
        report(SocketEvents.CONNECTING, base());
      }
    }),
    socket.events.onConnected(() => report(SocketEvents.CONNECTED, base())),
    socket.events.onDisconnected(() => report(SocketEvents.DISCONNECTED, base())),
    socket.events.onReconnecting(({ attempts }) => report(SocketEvents.RECONNECTING, { ...base(), attempts })),
    socket.events.onReconnectingFailed(({ attempts }) =>
      report(SocketEvents.RECONNECT_FAILED, { ...base(), attempts }),
    ),
    socket.events.onError(({ error }) => report(SocketEvents.ERROR, { ...base(), error: toTransferableError(error) })),
    socket.events.onListenerEvent(({ topic, data, extra }) =>
      report(SocketEvents.MESSAGE_RECEIVED, { ...base(), topic, data, extra }),
    ),
    socket.events.onEmitterStartEvent(({ emitter }) =>
      report(SocketEvents.MESSAGE_SENT, { ...base(), topic: emitter.topic, data: emitter.payload }),
    ),
    socket.events.onEmitterError(({ error, emitter }) =>
      report(SocketEvents.MESSAGE_FAILED, {
        ...base(),
        topic: emitter.topic,
        data: emitter.payload,
        error: toTransferableError(error),
      }),
    ),
  ];

  return {
    /** Tells HyperFlow about the socket and its current state */
    sendSnapshot: () => report(SocketEvents.REGISTERED, { ...base(), status: getStatus(socket) }),
    unmount: () => unmounts.forEach((unmount) => unmount()),
  };
};

/** Readable ids that stay the same for the same sockets, e.g. "ws://api/chat" and "ws://api/chat #2" */
export const getSocketIds = (sockets: SocketInstance[]) => {
  const seen = new Map<string, number>();
  return sockets.map((socket) => {
    const count = (seen.get(socket.url) ?? 0) + 1;
    seen.set(socket.url, count);
    return count === 1 ? socket.url : `${socket.url} #${count}`;
  });
};
