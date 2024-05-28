import { getUniqueRequestId } from "@hyper-fetch/core";

import { SocketInstance } from "socket";
import { EmitterOptionsType } from "emitter";

export const createEmitter = <PayloadType = any, ResponseDataType = any>(
  socket: SocketInstance,
  options?: Partial<EmitterOptionsType<any, any>>,
) => {
  const randomKey = getUniqueRequestId("some-event-emitter");
  return socket.createEmitter<{ payload: PayloadType; response: ResponseDataType }>()({
    topic: randomKey,
    ...options,
  });
};
