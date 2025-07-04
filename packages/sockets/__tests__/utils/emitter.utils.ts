import { getUniqueRequestId } from "@hyper-fetch/core";

import { SocketInstance } from "socket";
import { EmitterOptionsType } from "emitter";

export const createEmitter = <PayloadType = any>(
  socket: SocketInstance,
  options?: Partial<EmitterOptionsType<any, any>>,
) => {
  const randomKey = getUniqueRequestId({ queryKey: "some-event-emitter" });
  return socket.createEmitter<PayloadType>()({
    topic: randomKey,
    ...options,
  });
};
