import type { SocketAdapterInstance } from "adapter";
import type { EmitterInstance } from "emitter";

import type { ConnectCallbackType, MessageCallbackType, SendCallbackType, SocketConnectionType } from "./socket.types";

export const getErrorKey = () => "socket_error";
export const getOpenKey = () => "socket_open";
export const getCloseKey = () => "socket_close";
export const getConnectingKey = () => "socket_connecting";
export const getReconnectingKey = () => "socket_reconnecting";
export const getReconnectingFailedKey = () => "socket_reconnecting_stop";
export const getListenerEventKey = () => `listener_event`;
export const getListenerRemoveKey = () => `listener_remove`;
export const getEmitterStartEventKey = () => `emitter_start_event`;
export const getEmitterErrorKey = () => `emitter_error`;
export const getListenerRemoveByTopicKey = (event: string) => `${event}_listener_remove`;
export const getListenerEventByTopicKey = (event: string) => `${event}_listener_event`;
export const getEmitterStartEventByTopicKey = (event: string) => `${event}_emitter_start_event`;
export const getEmitterErrorByTopicKey = (event: string) => `${event}_emitter_error`;

/**
 * Runs the `onMessage` interceptors over the data of an incoming message. Every interceptor receives the data
 * returned by the previous one - the adapter `extra` is never touched.
 */
export const interceptListener = <Extra = any>(
  interceptors: MessageCallbackType<any>[],
  event: { data: any; extra: Extra },
): { data: any; extra: Extra } => {
  let { data } = event;
  // eslint-disable-next-line no-restricted-syntax
  for (const interceptor of interceptors) {
    const newData = interceptor({ event: data });
    // Falsy values like `0`, `""` or `false` are valid message data - only a dropped value is an error
    const isDropped = newData === undefined || (newData === null && data !== null);
    if (isDropped && data !== undefined) {
      throw new Error("Listener modifier must return data");
    }
    data = newData;
  }

  return { data, extra: event.extra };
};

/**
 * Runs the `onSend` interceptors over an emitter. Every interceptor receives the emitter
 * returned by the previous one.
 */
export const interceptEmitter = <EmitterType extends EmitterInstance>(
  interceptors: SendCallbackType<EmitterType>[],
  emitter: EmitterType,
) => {
  let newEmitter = emitter;
  // eslint-disable-next-line no-restricted-syntax
  for (const interceptor of interceptors) {
    newEmitter = interceptor({ emitter: newEmitter }) as EmitterType;
    if (!newEmitter) {
      throw new Error("Send modifier must return emitter");
    }
  }
  return newEmitter;
};

export const interceptConnection = async <Adapter extends SocketAdapterInstance>(
  interceptors: ConnectCallbackType<Adapter>[],
  data: { connection: SocketConnectionType<Adapter>; attempt: number },
): Promise<SocketConnectionType<Adapter>> => {
  let newConnection = data.connection;
  // eslint-disable-next-line no-restricted-syntax
  for (const interceptor of interceptors) {
    // Interceptors are sequential by design - each one receives the output of the previous one
    // eslint-disable-next-line no-await-in-loop
    newConnection = await interceptor({ connection: newConnection, attempt: data.attempt });
    if (!newConnection) {
      throw new Error("Connect modifier must return connection");
    }
  }
  return newConnection;
};
