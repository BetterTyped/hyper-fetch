import { EmitterInstance } from "emitter";
import { ListenerInstance } from "listener";

export type RemoveListenerCallbackType = () => void;

export type ListenerCallbackType<D = any> = (data: D, event: MessageEvent<D>) => void;

export type AdapterType = {
  connecting: boolean;
  listeners: Map<string, Set<ListenerCallbackType>>;
  emit: (eventMessageId: string, emitter: EmitterInstance, ack?: (error: Error | null, response: any) => void) => void;
  listen: (listener: ListenerInstance, callback: ListenerCallbackType) => RemoveListenerCallbackType;
  removeListener: (name: string, callback: (...args: any) => void) => void;
  connect: () => void;
  reconnect: () => void;
  disconnect: () => void;
};

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
