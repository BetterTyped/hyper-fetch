import { ExtractRouteParams, NegativeTypes } from "@hyper-fetch/core";

import { SocketAdapterInstance } from "adapter";
import { Listener } from "listener";
import {
  ExtractListenerHasParams,
  ExtractListenerTopicType,
  ExtractListenerResponseType,
  ExtractAdapterListenerOptionsType,
  ExtractAdapterExtraType,
} from "types";

export type ListenerInstance = Listener<any>;

export type ListenerOptionsType<topic extends string, AdapterType extends SocketAdapterInstance> = {
  topic: topic;
  params?: ExtractRouteParams<topic>;
  options?: ExtractAdapterListenerOptionsType<AdapterType>;
};

export type ListenType<Listener extends ListenerInstance, Adapter extends SocketAdapterInstance> = (
  options: ExtractRouteParams<ExtractListenerTopicType<Listener>> extends NegativeTypes
    ? { callback: ListenerCallbackType<Adapter, ExtractListenerResponseType<Listener>> }
    : ExtractListenerHasParams<Listener> extends false
      ? {
          params: ExtractRouteParams<ExtractListenerTopicType<Listener>>;
          callback: ListenerCallbackType<Adapter, ExtractListenerResponseType<Listener>>;
        }
      : {
          params?: never;
          callback: ListenerCallbackType<Adapter, ExtractListenerResponseType<Listener>>;
        },
) => () => void;

export type ListenerCallbackType<AdapterType extends SocketAdapterInstance, D> = (response: {
  data: D;
  extra: ExtractAdapterExtraType<AdapterType>;
}) => void;
