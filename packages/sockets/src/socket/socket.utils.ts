import { EmitterInstance } from "emitter";
import { MessageCallbackType, SendCallbackType, SocketInstance } from "./socket.types";

export const getErrorKey = () => "socket_error";
export const getOpenKey = () => "socket_open";
export const getCloseKey = () => "socket_close";
export const getConnectingKey = () => "socket_connecting";
export const getReconnectingKey = () => "socket_reconnecting";
export const getReconnectingFailedKey = () => "socket_reconnecting_stop";
export const getListenerEventKey = () => `listener_event`;
export const getListenerRemoveKey = () => `listener_remove`;
export const getEmitterStartEventKey = () => `emitter_start_event`;
export const getEmitterEventKey = () => `emitter_event`;
export const getEmitterErrorKey = () => `emitter_error`;
export const getListenerRemoveByTopicKey = (event: string) => `${event}_listener_remove`;
export const getListenerEventByTopicKey = (event: string) => `${event}_listener_event`;
export const getEmitterStartEventByTopicKey = (event: string) => `${event}_emitter_start_event`;
export const getEmitterEventByTopicKey = (event: string) => `${event}_emitter_event`;
export const getEmitterErrorByTopicKey = (event: string) => `${event}_emitter_error`;

export const interceptListener = <Socket extends SocketInstance>(
  interceptors: MessageCallbackType<Socket, any>[],
  data: { data: any; extra: any },
  socket: Socket,
) => {
  let newResponse = data;
  // eslint-disable-next-line no-restricted-syntax
  for (const interceptor of interceptors) {
    newResponse = interceptor(data, socket);
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
