import type { AppManager } from "@hyper-fetch/core";
import type { SocketAdapterInstance } from "adapter";
import type { EmitterInstance } from "emitter";
import type { Socket } from "socket";
import type { ExtractAdapterOptionsType, ExtractAdapterQueryParamsType } from "types";

export type SocketInstance = Socket<SocketAdapterInstance>;

export type SocketOptionsType<Adapter extends SocketAdapterInstance> = {
  url: string;
  /** How many times to reconnect after the connection was lost. @default Infinity */
  reconnect?: number;
  /** Delay in milliseconds before the next connection attempt after the connection was lost. @default 5000 */
  reconnectTime?: number;
  /**
   * How long in milliseconds one connection attempt may take before it is abandoned and a new attempt starts.
   * Separate from `reconnectTime`, so a short reconnect delay does not cut slow handshakes short. @default 5000
   */
  connectionTimeout?: number;
  adapter?: (() => Adapter) | Adapter;
  adapterOptions?: ExtractAdapterOptionsType<Adapter>;
  queryParams?: ExtractAdapterQueryParamsType<Adapter>;
  /**
   * Custom app manager initialization prop - e.g. to track the network state in React Native or Node.js
   */
  appManager?: () => AppManager;
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
/**
 * `onMessage` interceptor. Receives the message data as `event`, the listener `topic` and the adapter `extra` (e.g.
 * the `MessageEvent`, or the subscription of an RPC adapter) and returns the data delivered to the listeners.
 */
export type MessageCallbackType<Event, Extra = unknown> = (data: {
  event: Event;
  topic: string;
  extra: Extra;
}) => Event;
export type SendCallbackType<EmitterType extends EmitterInstance> = (data: { emitter: EmitterType }) => EmitterInstance;
export type ErrorCallbackType<Event> = (data: { error: Event }) => void;
