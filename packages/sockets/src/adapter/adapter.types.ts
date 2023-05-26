import { EmitterInstance } from "emitter";
import { ListenerInstance } from "listener";
import { SocketInstance } from "socket";

export type RemoveListenerCallbackType = () => void;

export type ListenerCallbackType<AdapterType extends SocketAdapterInstance, D> = (response: {
  data: D;
  event: MessageEvent<D>;
  extra: ExtractSocketExtraType<AdapterType>;
}) => void;

export type SocketAdapterType<
  AdapterOptions = { test: 1 },
  AdapterFormat = MessageEvent<any>,
  AdapterExtra = void,
  ListenerOptions = void,
  EmitterOptions = void,
> = (
  socket: SocketInstance,
  DO_NOT_USE?: {
    adapterOptions?: AdapterOptions;
    adapterFormat?: AdapterFormat;
    adapterExtra?: AdapterExtra;
    listenerOptions?: ListenerOptions;
    emitterOptions?: EmitterOptions;
  },
) => {
  listeners: Map<string, Set<ListenerCallbackType<SocketAdapterInstance, any>>>;
  listen: (
    listener: ListenerInstance,
    callback: ListenerCallbackType<SocketAdapterInstance, any>,
  ) => RemoveListenerCallbackType;
  removeListener: (name: string, callback: (...args: any) => void) => void;
  emit: (eventMessageId: string, emitter: EmitterInstance, ack?: (error: Error | null, response: any) => void) => void;
  connecting: boolean;
  connect: () => void;
  reconnect: () => void;
  disconnect: () => void;
};

export type SocketAdapterInstance = SocketAdapterType<any, any, any, any, any>;

// Extractors

export type ExtractSocketOptionsType<T> = T extends SocketAdapterType<infer O, any, any, any, any> ? O : never;
export type ExtractSocketFormatType<T> = T extends SocketAdapterType<any, infer E, any, any, any> ? E : never;
export type ExtractSocketExtraType<T> = T extends SocketAdapterType<any, any, infer O, any, any> ? O : never;
export type ExtractListenerOptionsType<T> = T extends SocketAdapterType<any, any, any, infer E, any> ? E : never;
export type ExtractEmitterOptionsType<T> = T extends SocketAdapterType<any, any, any, any, infer E> ? E : never;

export type ExtractUnionSocket<
  Adapter extends SocketAdapterInstance,
  Values extends {
    adapterOptions?: any;
    adapterFormat?: any;
    adapterExtra?: any;
    listenerOptions?: any;
    emitterOptions?: any;
  },
> = Extract<
  Adapter,
  SocketAdapterType<
    Values["adapterOptions"],
    Values["adapterFormat"],
    Values["adapterExtra"],
    Values["listenerOptions"],
    Values["emitterOptions"]
  >
> extends SocketAdapterInstance
  ? Extract<
      Adapter,
      SocketAdapterType<
        Values["adapterOptions"],
        Values["adapterFormat"],
        Values["adapterExtra"],
        Values["listenerOptions"],
        Values["emitterOptions"]
      >
    >
  : never;

// Options

export type SSEAdapterOptionsType = {
  reconnect?: number;
  reconnectTime?: number;
  autoConnect?: boolean;
  eventSourceInit?: EventSourceInit;
  reconnectTimeout?: number;
};

export type WSAdapterOptionsType = {
  reconnect?: number;
  reconnectTime?: number;
  autoConnect?: boolean;
  protocols?: string[];
  pingTimeout?: number;
  pongTimeout?: number;
  reconnectTimeout?: number;
  heartbeatMessage?: string;
  heartbeat?: boolean;
};

export type WSMessageType = {
  id: string;
  name: string;
  data: string;
};

// Adapters

export type WebsocketAdapterType = SocketAdapterType<WSAdapterOptionsType, MessageEvent<any>>;
export type SSEAdapterType = SocketAdapterType<SSEAdapterOptionsType, MessageEvent<any>>;
