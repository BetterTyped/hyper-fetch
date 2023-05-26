import { SocketAdapterInstance, ExtractListenerOptionsType } from "adapter";
import { Listener } from "listener";

export type ListenerInstance = Listener<any, SocketAdapterInstance>;

export type ListenerOptionsType<AdapterType extends SocketAdapterInstance> = {
  name: string;
  options?: ExtractListenerOptionsType<AdapterType>;
};
