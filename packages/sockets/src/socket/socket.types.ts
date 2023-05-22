import { QueryParamsType, QueryStringifyOptionsType, StringifyCallbackType } from "@hyper-fetch/core";

import { Socket } from "socket";
import { SSEAdapterOptionsType, WSAdapterOptionsType } from "adapter";
import { EmitterInstance } from "emitter";

export type SocketInstance = Socket<any>;

export type SocketOptionsType<SocketSocketAdapterType> = {
  url: string;
  adapter?: SocketSocketAdapterType;
  auth?: QueryParamsType;
  queryParams?: QueryParamsType | string;
  reconnect?: number;
  reconnectTime?: number;
  autoConnect?: boolean;
  queryParamsConfig?: QueryStringifyOptionsType;
  queryParamsStringify?: StringifyCallbackType;
};

export type SocketAdapterOptionsType<SocketSocketAdapterType> =
  | (SocketOptionsType<SocketSocketAdapterType> & { isSSE: true; adapterOptions?: SSEAdapterOptionsType })
  | (SocketOptionsType<SocketSocketAdapterType> & {
      adapterOptions?: WSAdapterOptionsType;
    });

export type ReconnectCallbackType<SocketType extends SocketInstance> = (socket: SocketType) => void;
export type ReconnectStopCallbackType<SocketType extends SocketInstance> = (socket: SocketType) => void;
export type OpenCallbackType<SocketType extends SocketInstance, Event> = (event: Event, socket: SocketType) => void;
export type CloseCallbackType<SocketType extends SocketInstance, Event> = (event: Event, socket: SocketType) => void;
export type MessageCallbackType<SocketType extends SocketInstance, Event> = (event: Event, socket: SocketType) => Event;
export type SendCallbackType<EmitterType extends EmitterInstance> = (emitter: EmitterType) => EmitterInstance;
export type ErrorCallbackType<SocketType extends SocketInstance, Event> = (event: Event, socket: SocketType) => void;
