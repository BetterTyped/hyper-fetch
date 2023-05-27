import { ExtractRouteParams } from "@hyper-fetch/core";

import { SocketAdapterInstance, ExtractListenerOptionsType } from "adapter";
import { Listener } from "listener";

export type ListenerInstance = Listener<any, any, SocketAdapterInstance>;

export type ListenerOptionsType<Name extends string, AdapterType extends SocketAdapterInstance> = {
  name: Name;
  params?: ExtractRouteParams<Name>;
  options?: ExtractListenerOptionsType<AdapterType>;
};
