import { TypeWithDefaults } from "@hyper-fetch/core";

import { EmitterInstance } from "emitter";
import { ListenerCallbackType, ListenerInstance } from "listener";
import { Socket } from "socket";

export type RemoveListenerCallbackType = () => void;

export type SocketAdapterInstance = SocketAdapterType<any>;

export type SocketAdapterType<
  Properties extends {
    options?: Record<string, any>;
    extra?: Record<string, any>;
    listenerOptions?: Record<string, any>;
    emitterOptions?: Record<string, any>;
  } = {
    options?: never;
    extra?: undefined;
    listenerOptions?: undefined;
    emitterOptions?: undefined;
  },
> = (
  socket: Socket<SocketAdapterType<Properties>>,
  DO_NOT_USE?: {
    options?: TypeWithDefaults<Properties, "options", never>;
    extra?: TypeWithDefaults<Properties, "extra", undefined>;
    listenerOptions?: TypeWithDefaults<Properties, "listenerOptions", undefined>;
    emitterOptions?: TypeWithDefaults<Properties, "emitterOptions", undefined>;
  },
) => {
  open: boolean;
  reconnectionAttempts: number;
  listeners: Map<string, Map<ListenerCallbackType<SocketAdapterInstance, any>, VoidFunction>>;
  listen: (
    listener: ListenerInstance,
    callback: ListenerCallbackType<
      SocketAdapterType<{
        options: TypeWithDefaults<Properties, "options", never>;
        extra: TypeWithDefaults<Properties, "extra", undefined>;
        listenerOptions: TypeWithDefaults<Properties, "listenerOptions", undefined>;
        emitterOptions: TypeWithDefaults<Properties, "emitterOptions", undefined>;
      }>,
      any
    >,
  ) => RemoveListenerCallbackType;
  removeListener: (topic: string, callback: (...args: any) => void) => void;
  emit: (eventMessageId: string, emitter: EmitterInstance) => void;
  connecting: boolean;
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
};

export type WSAdapterOptionsType = {
  protocols?: string[];
  pingTimeout?: number;
  pongTimeout?: number;
  heartbeatMessage?: string;
  heartbeat?: boolean;
};

export type WebsocketEvent<T = any> = {
  id?: string;
  topic: string;
  data: T;
};

export type ServerSentEvent<T = any> = {
  topic: string;
  data: T;
};

// Adapters

export type SocketData<D = any> = { topic: string; data: D };
export type WebsocketAdapterType = SocketAdapterType<{
  options: WSAdapterOptionsType;
  extra: MessageEvent<SocketData>;
}>;
export type SSEAdapterType = SocketAdapterType<{ options: SSEAdapterOptionsType; extra: MessageEvent<SocketData> }>;
