import type { EmitterInstance } from "emitter";
import type { ListenerCallbackType, ListenerOfAdapter } from "listener";
import type { SocketAdapter } from "./adapter";

export type RemoveListenerCallbackType = () => void;

export type SocketAdapterInstance = SocketAdapter<any, any, any, any, any, any>;

export type Connector<A extends SocketAdapterInstance = SocketAdapterInstance> = {
  connect: () => void;
  reconnect: () => void;
  disconnect: () => void;
  listen: (listener: ListenerOfAdapter<A>, callback: ListenerCallbackType<A, any>) => RemoveListenerCallbackType;
  emit: (emitter: EmitterInstance) => void;
};
