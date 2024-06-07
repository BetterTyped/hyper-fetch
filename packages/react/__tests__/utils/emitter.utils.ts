import { EmitterOptionsType, Socket, SocketAdapterType } from "@hyper-fetch/sockets";

export const createEmitter = <ResponseType = { name: string; age: number }>(
  options?: Partial<EmitterOptionsType<any, SocketAdapterType>>,
) => {
  return new Socket({ url: "ws://localhost:1234" }).createEmitter<ResponseType>()({ topic: "some-event", ...options });
};
