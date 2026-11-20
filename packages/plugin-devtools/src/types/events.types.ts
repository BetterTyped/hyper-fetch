export enum CoreEvents {
  ON_CACHE_CHANGE = "ON_CACHE_CHANGE",
  ON_CACHE_INVALIDATION = "ON_CACHE_INVALIDATION",
  ON_CACHE_DELETE = "ON_CACHE_DELETE",
  ON_REQUEST_LOADING = "ON_REQUEST_LOADING",
  ON_FETCH_QUEUE_STATUS_CHANGE = "ON_FETCH_QUEUE_STATUS_CHANGE",
  ON_FETCH_QUEUE_CLEAR = "ON_FETCH_QUEUE_CLEAR",
  ON_SUBMIT_QUEUE_STATUS_CHANGE = "ON_SUBMIT_QUEUE_STATUS_CHANGE",
  ON_SUBMIT_QUEUE_CLEAR = "ON_SUBMIT_QUEUE_CLEAR",
}

export enum CustomEvents {
  REQUEST_CREATED = "REQUEST_CREATED",
}

export enum EventSourceType {
  REQUEST_MANAGER = "requestManager",
  APP_MANAGER = "appManager",
  CACHE = "cache",
  SUBMIT_DISPATCHER = "submitDispatcher",
  FETCH_DISPATCHER = "fetchDispatcher",
  CUSTOM_EVENT = "customEvent",
  /** Events of the sockets passed in the `sockets` option */
  SOCKET = "socket",
}

/** What happens to the sockets HyperFlow inspects */
export enum SocketEvents {
  /** The socket's identity and current state. Sent when the plugin starts and every time HyperFlow connects. */
  REGISTERED = "SOCKET_REGISTERED",
  CONNECTING = "SOCKET_CONNECTING",
  CONNECTED = "SOCKET_CONNECTED",
  DISCONNECTED = "SOCKET_DISCONNECTED",
  RECONNECTING = "SOCKET_RECONNECTING",
  RECONNECT_FAILED = "SOCKET_RECONNECT_FAILED",
  ERROR = "SOCKET_ERROR",
  /** A message arrived on a topic */
  MESSAGE_RECEIVED = "SOCKET_MESSAGE_RECEIVED",
  /** An emitter sent a message */
  MESSAGE_SENT = "SOCKET_MESSAGE_SENT",
  /** An emitter failed to send a message */
  MESSAGE_FAILED = "SOCKET_MESSAGE_FAILED",
}

export type DevtoolsSocketStatus = "connecting" | "connected" | "disconnected" | "reconnecting" | "failed";

/** The data of every socket event */
export type DevtoolsSocketEventData = {
  /** Identifies the socket within the application */
  socketId: string;
  url: string;
  adapterName: string;
  /** When it happened in the application */
  timestamp: number;
  /** State of the socket after the event, set on `REGISTERED` */
  status?: DevtoolsSocketStatus;
  topic?: string;
  /** Received data or sent payload */
  data?: unknown;
  /** Adapter details of a received message */
  extra?: unknown;
  error?: { name: string; message: string } | unknown;
  /** Reconnection attempt */
  attempts?: number;
};

/*
 * Internal communication events used to communicate state between plugin and devtools app
 * */
export enum InternalEvents {
  PLUGIN_INITIALIZED = "PLUGIN_INITIALIZED",
  PLUGIN_HANGUP = "PLUGIN_HANGUP",
  APP_INITIALIZED = "APP_INITIALIZED",
}
