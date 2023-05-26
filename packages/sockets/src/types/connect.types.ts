import { ListenerCallbackType, SocketAdapterInstance } from "adapter";

export type ConnectMethodType<AdapterType extends SocketAdapterInstance, EventType = unknown> = (
  ...args: Parameters<ListenerCallbackType<AdapterType, EventType>>
) => void;
