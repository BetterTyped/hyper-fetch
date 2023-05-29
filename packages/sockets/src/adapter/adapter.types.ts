import { EmitterInstance } from "emitter";
import { Listener } from "listener";
import { Socket } from "socket";

export type RemoveListenerCallbackType = () => void;

export type ListenerCallbackType<AdapterType extends SocketAdapterInstance, D> = (response: {
  data: D;
  extra: ExtractSocketExtraType<AdapterType>;
}) => void;

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
  open: boolean;
  reconnectionAttempts: number;
  listeners: Map<string, Map<ListenerCallbackType<SocketAdapterInstance, any>, VoidFunction>>;
  listen: (
    listener: Listener<any, any, SocketAdapterType<AdapterOptions, AdapterExtra, ListenerOptions, EmitterOptions>>,
    callback: ListenerCallbackType<
      SocketAdapterType<AdapterOptions, AdapterExtra, ListenerOptions, EmitterOptions>,
      any
    >,
  ) => RemoveListenerCallbackType;
  removeListener: (name: string, callback: (...args: any) => void) => void;
  emit: (eventMessageId: string, emitter: EmitterInstance, ack?: (error: Error | null, response: any) => void) => void;
  connecting: boolean;
  connect: () => void;
  reconnect: () => void;
  disconnect: () => void;
};

export type SocketAdapterInstance = SocketAdapterType<any, any, any, any>;

// Extractors

export type ExtractSocketOptionsType<T> = T extends SocketAdapterType<infer O, any, any, any> ? O : never;
export type ExtractSocketExtraType<T> = T extends SocketAdapterType<any, infer E, any, any> ? E : never;
export type ExtractListenerOptionsType<T> = T extends SocketAdapterType<any, any, infer O, any> ? O : never;
export type ExtractEmitterOptionsType<T> = T extends SocketAdapterType<any, any, any, infer E> ? E : never;

export type ExtractUnionSocket<
  Adapter extends SocketAdapterInstance,
  Values extends {
    adapterOptions?: any;
    adapterExtra?: any;
    listenerOptions?: any;
    emitterOptions?: any;
  },
> = Extract<
  Adapter,
  SocketAdapterType<
    Values["adapterOptions"],
    Values["adapterExtra"],
    Values["listenerOptions"],
    Values["emitterOptions"]
  >
> extends SocketAdapterInstance
  ? Extract<
      Adapter,
      SocketAdapterType<
        Values["adapterOptions"],
        Values["adapterExtra"],
        Values["listenerOptions"],
        Values["emitterOptions"]
      >
    >
  : never;

// Options

export type SSEAdapterOptionsType = {
  eventSourceInit?: EventSourceInit;
};

export type WSAdapterOptionsType = {
  protocols?: string[];
  pingTimeout?: number;
  pongTimeout?: number;
  heartbeatMessage?: string;
  heartbeat?: boolean;
};

export type WSMessageType = {
  id: string;
  name: string;
  data: string;
};

// Adapters

export type SocketData<D = any> = { name: string; data: D };
export type WebsocketAdapterType = SocketAdapterType<WSAdapterOptionsType, MessageEvent<SocketData>>;
export type SSEAdapterType = SocketAdapterType<SSEAdapterOptionsType, MessageEvent<SocketData>>;
