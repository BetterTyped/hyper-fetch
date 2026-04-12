import type { Socket } from "socket";
import type { SocketAdapterInstance } from "adapter";
import type { EmitterInstance } from "emitter";
import type { ExtractAdapterOptionsType, ExtractAdapterQueryParamsType } from "types";

export type SocketInstance = Socket<SocketAdapterInstance>;

export type SocketOptionsType<Adapter extends SocketAdapterInstance> = {
  url: string;
  reconnect?: number;
  reconnectTime?: number;
  adapter?: (() => Adapter) | Adapter;
  adapterOptions?: ExtractAdapterOptionsType<Adapter>;
  queryParams?: ExtractAdapterQueryParamsType<Adapter>;
};

export type ReconnectCallbackType = () => void;
export type ReconnectFailedCallbackType = () => void;
export type OpenCallbackType = () => void;
export type CloseCallbackType = () => void;
export type MessageCallbackType<Event> = (data: { event: Event }) => Event;
export type SendCallbackType<EmitterType extends EmitterInstance> = (data: { emitter: EmitterType }) => EmitterInstance;
export type ErrorCallbackType<Event> = (data: { error: Event }) => void;
