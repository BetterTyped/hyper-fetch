import { EmitterInstance } from "emitter";
import { ListenerInstance } from "listener";

// eslint-disable-next-line @typescript-eslint/ban-types
type EmptyObject = {};

export type RemoveListenerCallbackType = () => void;

export type ListenerCallbackType<D = any> = (data: D, event: MessageEvent<D>) => void;

export type SocketAdapterType<
  ListenerEnabled = true,
  ListenerOptions = void,
  ListenerExtra = void,
  EmitterEnabled = true,
  EmitterOptions = void,
  EmitterExtra = void,
> = (ListenerEnabled extends true
  ? {
      listeners: Map<string, Set<ListenerCallbackType>>;
      listen: (listener: ListenerInstance, callback: ListenerCallbackType) => RemoveListenerCallbackType;
      removeListener: (name: string, callback: (...args: any) => void) => void;
    }
  : EmptyObject) &
  (EmitterEnabled extends true
    ? {
        emit: (
          eventMessageId: string,
          emitter: EmitterInstance,
          ack?: (error: Error | null, response: any) => void,
        ) => void;
      }
    : EmptyObject) & {
    connecting: boolean;
    connect: () => void;
    reconnect: () => void;
    disconnect: () => void;
    DO_NOT_USE?: {
      // Listener
      listenerEnabled?: ListenerEnabled;
      listenerOptions?: ListenerOptions;
      listenerExtra?: ListenerExtra;
      // Emitter
      emitterEnabled?: EmitterEnabled;
      emitterOptions?: EmitterOptions;
      emitterExtra?: EmitterExtra;
    };
  };

export type SocketAdapterInstance = SocketAdapterType<any, any, any, any, any, any>;

//

export type SSEAdapterOptionsType = {
  eventSourceInit?: EventSourceInit;
  reconnectTimeout?: number;
};

export type WSAdapterOptionsType = {
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
