import type { SocketAdapterInstance } from "adapter";
import type { ListenerCallbackType } from "listener";

export type ConnectMethodType<AdapterType extends SocketAdapterInstance, EventType = unknown> = (
  response: Parameters<ListenerCallbackType<AdapterType, EventType>>[0],
) => void;
