import { getUniqueRequestId } from "@hyper-fetch/core";

import { SocketInstance } from "socket";
import { EmitterOptionsType } from "emitter";

export const createEmitter = <PayloadType = any, ResponseDataType = any>(
  socket: SocketInstance,
  options?: Partial<EmitterOptionsType<any>>,
) => {
  const randomKey = getUniqueRequestId("some-event-emitter");
  return socket.createEmitter<PayloadType, ResponseDataType>({ name: randomKey, ...options });
};
