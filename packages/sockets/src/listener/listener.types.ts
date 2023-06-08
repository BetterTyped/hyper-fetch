import { ExtractRouteParams, NegativeTypes } from "@hyper-fetch/core";

import { SocketAdapterInstance, ExtractListenerOptionsType, ListenerCallbackType, SocketAdapterType } from "adapter";
import { Listener } from "listener";
import { ExtractListenerHasParams, ExtractListenerEndpointType, ExtractListenerResponseType } from "types";

export type ListenerInstance = Listener<any, any, SocketAdapterInstance, any>;

export type ListenerOptionsType<Endpoint extends string, AdapterType extends SocketAdapterInstance> = {
  endpoint: Endpoint;
  params?: ExtractRouteParams<Endpoint>;
  options?: ExtractListenerOptionsType<AdapterType>;
};

export type ListenType<Listener extends ListenerInstance, Adapter extends SocketAdapterType> = (
  options: ExtractRouteParams<ExtractListenerEndpointType<Listener>> extends NegativeTypes
    ? { callback: ListenerCallbackType<Adapter, ExtractListenerResponseType<Listener>> }
    : ExtractListenerHasParams<Listener> extends false
    ? {
        params: ExtractRouteParams<ExtractListenerEndpointType<Listener>>;
        callback: ListenerCallbackType<Adapter, ExtractListenerResponseType<Listener>>;
      }
    : {
        params?: never;
        callback: ListenerCallbackType<Adapter, ExtractListenerResponseType<Listener>>;
      },
) => () => void;
