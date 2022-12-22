import { EmitterInstance } from "emitter";
import { ListenerInstance } from "listener";

export type RemoveListenerCallbackType = () => void;

export type ListenerCallbackType<D = any> = (data: D, event: MessageEvent<D>) => void;

export type WebsocketClientType = {
  connecting: boolean;
  listeners: Map<string, Set<ListenerCallbackType>>;
  emit: (eventMessageId: string, emitter: EmitterInstance, ack?: (error: Error | null, response: any) => void) => void;
  listen: (listener: ListenerInstance, callback: ListenerCallbackType) => RemoveListenerCallbackType;
  removeListener: (name: string, callback: (...args: any) => void) => void;
  connect: () => void;
  disconnect: () => void;
};

export type ServerSentEventsClientOptionsType = {
  eventSourceInit?: EventSourceInit;
  reconnectTimeout?: number;
};

export type WebsocketClientOptionsType = {
  protocols?: string[];
  pingTimeout?: number;
  pongTimeout?: number;
  reconnectTimeout?: number;
  heartbeatMessage?: string;
  heartbeat?: boolean;
};

export type WSMessageType = {
  id: string;
  type: string;
  data: string;
};
