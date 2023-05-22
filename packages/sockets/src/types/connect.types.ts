import { ListenerCallbackType } from "adapter";

export type ConnectMethodType<EventType = unknown> = (...args: Parameters<ListenerCallbackType<EventType>>) => void;
