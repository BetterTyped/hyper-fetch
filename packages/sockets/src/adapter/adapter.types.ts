import { EmitterInstance } from "emitter";
import { ListenerCallbackType, ListenerInstance } from "listener";
import type { SocketAdapter } from "./adapter";

export type RemoveListenerCallbackType = () => void;

export type SocketAdapterInstance = SocketAdapter<any, any, any, any, any, any>;

export type Connector = {
  connect: () => void;
  reconnect: () => void;
  disconnect: () => void;
  listen: (
    listener: ListenerInstance,
    callback: ListenerCallbackType<SocketAdapterInstance, any>,
  ) => RemoveListenerCallbackType;
  emit: (emitter: EmitterInstance) => void;
};
