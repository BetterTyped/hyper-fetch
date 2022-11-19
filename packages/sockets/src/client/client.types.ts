import { EmitterInstance } from "emitter";
import { ListenerInstance } from "listener";

type RemoveListener = () => void;

export type ClientType<SocketType> = {
  emit: (emitter: EmitterInstance) => Promise<boolean>;
  listen: (listener: ListenerInstance, callback: () => void) => RemoveListener;
  removeListener: (listener: ListenerInstance, callback: () => void) => void;
  connect: () => void;
  disconnect: () => void;
  listeners: Array<() => void>;
} & SocketType;
