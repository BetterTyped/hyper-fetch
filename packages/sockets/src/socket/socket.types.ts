import type { SocketAdapterInstance } from "adapter";
import type { EmitterInstance } from "emitter";
import type { Socket } from "socket";
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

/**
 * Everything an adapter needs to open a connection. Built from the socket's static configuration
 * and passed through the `onConnect` interceptors right before every connection attempt.
 */
export type SocketConnectionType<Adapter extends SocketAdapterInstance> = {
  url: string;
  queryParams: ExtractAdapterQueryParamsType<Adapter> | undefined;
  adapterOptions: ExtractAdapterOptionsType<Adapter> | undefined;
};

/**
 * Interceptor invoked before every connection attempt (initial, automatic reconnect, manual reconnect).
 * Receives the connection details and must return them - modified or not. May be async.
 * `attempt` is `0` for a fresh connection and the reconnection attempt number otherwise.
 */
export type ConnectCallbackType<Adapter extends SocketAdapterInstance> = (data: {
  connection: SocketConnectionType<Adapter>;
  attempt: number;
}) => SocketConnectionType<Adapter> | Promise<SocketConnectionType<Adapter>>;

export type ReconnectCallbackType = () => void;
export type ReconnectFailedCallbackType = () => void;
export type OpenCallbackType = () => void;
export type CloseCallbackType = () => void;
export type MessageCallbackType<Event> = (data: { event: Event }) => Event;
export type SendCallbackType<EmitterType extends EmitterInstance> = (data: { emitter: EmitterType }) => EmitterInstance;
export type ErrorCallbackType<Event> = (data: { error: Event }) => void;
