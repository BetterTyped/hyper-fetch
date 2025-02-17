import { Socket } from "socket";
import { SocketAdapterInstance } from "adapter";
import { EmitterInstance } from "emitter";
import { ExtractAdapterOptionsType, ExtractAdapterQueryParamsType } from "types";

export type SocketInstance = Socket<SocketAdapterInstance>;

export type SocketOptionsType<Adapter extends SocketAdapterInstance> = {
  url: string;
  reconnect?: number;
  reconnectTime?: number;
  adapter?: (() => Adapter) | Adapter;
  adapterOptions?: ExtractAdapterOptionsType<Adapter>;
  queryParams?: ExtractAdapterQueryParamsType<Adapter>;
};

export type ReconnectCallbackType<SocketType extends SocketInstance> = (socket: SocketType) => void;
export type ReconnectFailedCallbackType<SocketType extends SocketInstance> = (socket: SocketType) => void;
export type OpenCallbackType<SocketType extends SocketInstance> = (socket: SocketType) => void;
export type CloseCallbackType<SocketType extends SocketInstance> = (socket: SocketType) => void;
export type MessageCallbackType<SocketType extends SocketInstance, Event> = (event: Event, socket: SocketType) => Event;
export type SendCallbackType<EmitterType extends EmitterInstance> = (emitter: EmitterType) => EmitterInstance;
export type ErrorCallbackType<SocketType extends SocketInstance, Event> = (event: Event, socket: SocketType) => void;
