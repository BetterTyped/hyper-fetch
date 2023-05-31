import { ListenerCallbackType, SocketAdapterInstance } from "adapter";

export type ConnectMethodType<AdapterType extends SocketAdapterInstance, EventType = unknown> = (
  response: Parameters<ListenerCallbackType<AdapterType, EventType>>[0],
  unsubscribe: () => void,
) => void;
