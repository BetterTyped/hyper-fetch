import { SocketAdapterInstance } from "adapter";
import { ListenerCallbackType } from "listener";

export type ConnectMethodType<AdapterType extends SocketAdapterInstance, EventType = unknown> = (
  response: Parameters<ListenerCallbackType<AdapterType, EventType>>[0],
  unsubscribe: () => void,
) => void;
