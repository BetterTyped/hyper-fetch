import { EmitterInstance } from "emitter";
import { Listener, ListenerCallbackType } from "listener";
import { Socket } from "socket";

export type RemoveListenerCallbackType = () => void;

export type SocketAdapterInstance = SocketAdapterType<any, any, any, any>;

export type SocketAdapterType<
  AdapterOptions extends Record<string, any> = never,
  AdapterExtra extends Record<string, any> = Record<never, never>,
  ListenerOptions extends Record<string, any> = never,
  EmitterOptions extends Record<string, any> = never,
> = (
  socket: Socket<SocketAdapterType<AdapterOptions, AdapterExtra, ListenerOptions, EmitterOptions>>,
  DO_NOT_USE?: {
    adapterOptions?: AdapterOptions;
    adapterExtra?: AdapterExtra;
    listenerOptions?: ListenerOptions;
    emitterOptions?: EmitterOptions;
  },
) => {
  state: {
    connected: boolean;
    connecting: boolean;
    reconnectionAttempts: number;
    forceClosed: boolean;
  };
  listeners: Map<string, Map<ListenerCallbackType<SocketAdapterInstance, any>, VoidFunction>>;
  listen: (
    listener: Listener<any, any, SocketAdapterType<AdapterOptions, AdapterExtra, ListenerOptions, EmitterOptions>>,
    callback: ListenerCallbackType<
      SocketAdapterType<AdapterOptions, AdapterExtra, ListenerOptions, EmitterOptions>,
      any
    >,
  ) => RemoveListenerCallbackType;
  removeListener: (topic: string, callback: (...args: any) => void) => void;
  emit: (emitter: EmitterInstance, data: any) => void;
  connect: () => void;
  reconnect: () => void;
  disconnect: () => void;
};

// Extractors

export type ExtractUnionSocket<
  Adapter extends SocketAdapterInstance,
  Values extends {
    options?: any;
    extra?: any;
    listenerOptions?: any;
    emitterOptions?: any;
  },
> =
  Extract<Adapter, SocketAdapterType<Values>> extends SocketAdapterInstance
    ? Extract<Adapter, SocketAdapterType<Values>>
    : never;

// Options

export type SSEAdapterOptionsType = {
  eventSourceInit?: EventSourceInit;
  autoConnect?: boolean;
};

export type WSAdapterOptionsType = {
  protocols?: string[];
  pingTimeout?: number;
  pongTimeout?: number;
  heartbeatMessage?: string;
  heartbeat?: boolean;
  autoConnect?: boolean;
};

export type WebsocketEvent<T = any> = {
  topic: string;
  data: T;
};

export type ServerSentEvent<T = any> = {
  topic: string;
  data: T;
};

// Adapters

export type SocketData<D = any> = { topic: string; data: D };
export type WebsocketAdapterType = SocketAdapterType<WSAdapterOptionsType, MessageEvent<SocketData>>;
export type ServerSentEventsAdapterType = SocketAdapterType<SSEAdapterOptionsType, MessageEvent<SocketData>>;
