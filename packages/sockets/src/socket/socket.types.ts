import { QueryParamsType, QueryStringifyOptionsType, StringifyCallbackType } from "@hyper-fetch/core";

import { Socket } from "socket";
import { SSEAdapterOptionsType, WSAdapterOptionsType } from "adapter";
import { EmitterInstance } from "emitter";

export type SocketInstance = Socket<any>;

export type SocketOptionsType<SocketAdapterType> = {
  url: string;
  adapter?: SocketAdapterType;
  auth?: QueryParamsType;
  queryParams?: QueryParamsType | string;
  reconnect?: number;
  reconnectTime?: number;
  autoConnect?: boolean;
  queryParamsConfig?: QueryStringifyOptionsType;
  queryParamsStringify?: StringifyCallbackType;
};

export type SocketAdapterOptionsType<SocketAdapterType> =
  | (SocketOptionsType<SocketAdapterType> & { isSSE: true; adapterOptions?: SSEAdapterOptionsType })
  | (SocketOptionsType<SocketAdapterType> & {
      adapterOptions?: WSAdapterOptionsType;
    });

export type ReconnectCallbackType<SocketType extends SocketInstance> = (socket: SocketType) => void;
export type ReconnectStopCallbackType<SocketType extends SocketInstance> = (socket: SocketType) => void;
export type OpenCallbackType<SocketType extends SocketInstance, Event> = (event: Event, socket: SocketType) => void;
export type CloseCallbackType<SocketType extends SocketInstance, Event> = (event: Event, socket: SocketType) => void;
export type MessageCallbackType<SocketType extends SocketInstance, Event> = (event: Event, socket: SocketType) => Event;
export type SendCallbackType<EmitterType extends EmitterInstance> = (emitter: EmitterType) => EmitterInstance;
export type ErrorCallbackType<SocketType extends SocketInstance, Event> = (event: Event, socket: SocketType) => void;
