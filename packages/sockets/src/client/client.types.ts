import { EmitterInstance } from "emitter";
import { ListenerInstance } from "listener";

type RemoveListener = () => void;

export type WebsocketClientType = {
  connecting: boolean;
  listeners: Array<() => void>;
  emit: (emitter: EmitterInstance) => Promise<boolean>;
  listen: (listener: ListenerInstance, callback: (data: any) => void) => RemoveListener;
  removeListener: (listener: ListenerInstance, callback: (...args: any) => void) => void;
  connect: () => void;
  disconnect: () => void;
  listenerOptions?: undefined;
  emitterOptions?: undefined;
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
