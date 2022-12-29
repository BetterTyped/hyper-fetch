import { EmitterInstance } from "emitter";
import { MessageCallbackType, SendCallbackType, SocketInstance } from "./socket.types";

export const getErrorKey = () => "socket_error";
export const getOpenKey = () => "socket_open";
export const getCloseKey = () => "socket_close";
export const getConnectingKey = () => "socket_connecting";
export const getReconnectingKey = () => "socket_reconnecting";
export const getReconnectingStopKey = () => "socket_reconnecting_stop";
export const getListenerEventKey = () => `listener_event`;
export const getListenerRemoveKey = () => `listener_remove`;
export const getEmitterEventKey = () => `emitter_event`;
export const getListenerRemoveByNameKey = (event: string) => `${event}_listener_remove`;
export const getListenerEventByNameKey = (event: string) => `${event}_listener_event`;
export const getEmitterEventByNameKey = (event: string) => `${event}_emitter_event`;

export const interceptListener = <Socket extends SocketInstance>(
  interceptors: MessageCallbackType<Socket, MessageEvent>[],
  response: MessageEvent,
  socket: Socket,
) => {
  let newResponse = response;
  // eslint-disable-next-line no-restricted-syntax
  for (const interceptor of interceptors) {
    newResponse = interceptor(response, socket);
    if (!newResponse) throw new Error("Listener modifier must return data");
  }

  return newResponse;
};

export const interceptEmitter = <EmitterType extends EmitterInstance>(
  interceptors: SendCallbackType<EmitterType>[],
  emitter: EmitterType,
) => {
  let newEmitter = emitter;
  // eslint-disable-next-line no-restricted-syntax
  for (const interceptor of interceptors) {
    newEmitter = interceptor(emitter) as EmitterType;
    if (!newEmitter) throw new Error("Send modifier must return emitter");
  }
  return newEmitter;
};
