import type { EmitterOptionsType, WebsocketAdapterType } from "@hyper-fetch/sockets";
import { Socket } from "@hyper-fetch/sockets";

export const createEmitter = <ResponseType = { name: string; age: number }>(
  options?: Partial<EmitterOptionsType<any, WebsocketAdapterType>>,
) => {
  return new Socket({ url: "ws://localhost:1234" }).createEmitter<ResponseType>()({ topic: "some-event", ...options });
};
