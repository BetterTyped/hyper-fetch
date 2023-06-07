import { ExtractRouteParams, NegativeTypes } from "@hyper-fetch/core";

import { SocketAdapterInstance, ExtractListenerOptionsType, ListenerCallbackType } from "adapter";
import { Listener } from "listener";
import {
  ExtractListenerHasParams,
  ExtractListenerEndpointType,
  ExtractListenerResponseType,
  ExtractListenerAdapterType,
} from "types";

export type ListenerInstance = Listener<any, any, SocketAdapterInstance, any>;

export type ListenerOptionsType<Endpoint extends string, AdapterType extends SocketAdapterInstance> = {
  endpoint: Endpoint;
  params?: ExtractRouteParams<Endpoint>;
  options?: ExtractListenerOptionsType<AdapterType>;
};

export type ListenType<Listener extends ListenerInstance> = (
  options: ExtractRouteParams<ExtractListenerEndpointType<Listener>> extends NegativeTypes
    ? { callback: ListenerCallbackType<ExtractListenerAdapterType<Listener>, ExtractListenerResponseType<Listener>> }
    : ExtractListenerHasParams<Listener> extends false
    ? {
        params: ExtractRouteParams<ExtractListenerEndpointType<Listener>>;
        callback: ListenerCallbackType<ExtractListenerAdapterType<Listener>, ExtractListenerResponseType<Listener>>;
      }
    : {
        params?: never;
        callback: ListenerCallbackType<ExtractListenerAdapterType<Listener>, ExtractListenerResponseType<Listener>>;
      },
) => () => void;
