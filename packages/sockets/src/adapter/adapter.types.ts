import type { EmitterInstance } from "emitter";
import type { ListenerCallbackType, ListenerOfAdapter } from "listener";

import type { SocketAdapter } from "./adapter";

export type RemoveListenerCallbackType = () => void;

/**
 * What a registration of a listener does when its server-side subscription starts or ends.
 * `Listener.listen()` sets it, adapters reach it through the `onListenerStart` / `onListenerEnd` bindings.
 */
export type ListenerLifecycleType = {
  /** The server confirmed the subscription, also after it was restarted by a reconnect */
  onStart: () => void;
  /** The server ended the subscription - `error` is `null` when it finished without an error */
  onEnd: (data: { error: Error | null }) => void;
};

export type SocketAdapterInstance = SocketAdapter<any, any, any, any, any, any, any>;

export type Connector<A extends SocketAdapterInstance = SocketAdapterInstance> = {
  connect: () => void;
  reconnect: () => void;
  disconnect: () => void;
  listen: (listener: ListenerOfAdapter<A>, callback: ListenerCallbackType<A, any>) => RemoveListenerCallbackType;
  emit: (emitter: EmitterInstance) => void;
  /**
   * Removes what the connector subscribed to outside of the connection, e.g. the app manager's online event.
   * Called when the socket is destroyed and before the adapter is initialized for another socket.
   */
  dispose?: () => void;
};
