import { ExtractRouteParams, NegativeTypes } from "@hyper-fetch/core";

import { SocketAdapterInstance, ExtractListenerOptionsType, ListenerCallbackType } from "adapter";
import { Listener } from "listener";
import { ExtractListenerHasParams, ExtractListenerNameType, ExtractListenerResponseType } from "types";

export type ListenerInstance = Listener<any, any, SocketAdapterInstance, any>;

export type ListenerOptionsType<Name extends string, AdapterType extends SocketAdapterInstance> = {
  name: Name;
  params?: ExtractRouteParams<Name>;
  options?: ExtractListenerOptionsType<AdapterType>;
};

export type ListenType<Listener extends ListenerInstance> = (
  options: ExtractRouteParams<ExtractListenerNameType<Listener>> extends NegativeTypes
    ? { callback: ListenerCallbackType<SocketAdapterInstance, ExtractListenerResponseType<Listener>> }
    : ExtractListenerHasParams<Listener> extends false
    ? {
        params: ExtractRouteParams<ExtractListenerNameType<Listener>>;
        callback: ListenerCallbackType<SocketAdapterInstance, ExtractListenerResponseType<Listener>>;
      }
    : {
        params: never;
        callback: ListenerCallbackType<SocketAdapterInstance, ExtractListenerResponseType<Listener>>;
      },
) => () => void;
