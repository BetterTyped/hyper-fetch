import { getUniqueRequestId } from "@hyper-fetch/core";
import type { EmitterOptionsType } from "emitter";
import type { SocketInstance } from "socket";

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
