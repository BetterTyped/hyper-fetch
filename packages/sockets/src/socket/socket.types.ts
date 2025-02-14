import { QueryParamsType, QueryStringifyOptionsType, QueryParamsMapper } from "@hyper-fetch/core";

import { Socket } from "socket";
import { SocketAdapterInstance } from "adapter";
import { EmitterInstance } from "emitter";
import { ExtractAdapterOptionsType } from "types";

export type SocketInstance = Socket<any>;

export type SocketOptionsType<Adapter extends SocketAdapterInstance> = {
  url: string;
  adapter?: Adapter;
  reconnect?: number;
  reconnectTime?: number;
  queryParams?: QueryParamsType | string;
  autoConnect?: boolean;
  queryParamsConfig?: QueryStringifyOptionsType;
  queryParamsStringify?: QueryParamsMapper<QueryParamsType | string>;
  adapterOptions?: ExtractAdapterOptionsType<Adapter>;
};

export type ReconnectCallbackType<SocketType extends SocketInstance> = (socket: SocketType) => void;
export type ReconnectFailedCallbackType<SocketType extends SocketInstance> = (socket: SocketType) => void;
export type OpenCallbackType<SocketType extends SocketInstance> = (socket: SocketType) => void;
export type CloseCallbackType<SocketType extends SocketInstance> = (socket: SocketType) => void;
export type MessageCallbackType<SocketType extends SocketInstance, Event> = (event: Event, socket: SocketType) => Event;
export type SendCallbackType<EmitterType extends EmitterInstance> = (emitter: EmitterType) => EmitterInstance;
export type ErrorCallbackType<SocketType extends SocketInstance, Event> = (event: Event, socket: SocketType) => void;
