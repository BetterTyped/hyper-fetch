import { ExtractRouteParams, NegativeTypes, TypeWithDefaults } from "@hyper-fetch/core";

import { SocketAdapterInstance } from "adapter";
import { Listener } from "listener";
import {
  ExtractListenerHasParamsType,
  ExtractListenerTopicType,
  ExtractListenerResponseType,
  ExtractAdapterListenerOptionsType,
  ExtractAdapterExtraType,
  ExtractListenerAdapterType,
} from "types";

export type ListenerInstance = Listener<any, any, any, any>;

export type ListenerOptionsType<Topic extends string, AdapterType extends SocketAdapterInstance> = {
  topic: Topic;
  params?: ExtractRouteParams<Topic>;
  options?: ExtractAdapterListenerOptionsType<AdapterType>;
};

export type ListenerParamsOptionsType<Listener extends ListenerInstance> =
  ExtractListenerHasParamsType<Listener> extends false
    ? {
        params: ExtractRouteParams<ExtractListenerTopicType<Listener>>;
      }
    : {
        params?: never;
      };

export type ListenerListenOptionsType<Listener extends ListenerInstance> = ListenerParamsOptionsType<Listener>;

export type ListenType<Listener extends ListenerInstance, Adapter extends SocketAdapterInstance> =
  ExtractRouteParams<ExtractListenerTopicType<Listener>> extends NegativeTypes
    ? (
        callback: ListenerCallbackType<Adapter, ExtractListenerResponseType<Listener>>,
        options?: ListenerListenOptionsType<Listener>,
      ) => () => void
    : ExtractListenerHasParamsType<Listener> extends true
      ? (
          callback: ListenerCallbackType<Adapter, ExtractListenerResponseType<Listener>>,
          options?: ListenerListenOptionsType<Listener>,
        ) => () => void
      : (
          callback: ListenerCallbackType<Adapter, ExtractListenerResponseType<Listener>>,
          options: ListenerListenOptionsType<Listener>,
        ) => () => void;

export type ListenerCallbackType<AdapterType extends SocketAdapterInstance, D> = (response: {
  data: D;
  extra: ExtractAdapterExtraType<AdapterType>;
}) => void;

export type ExtendListener<
  T extends ListenerInstance,
  Properties extends {
    response?: any;
    topic?: string;
    adapter?: SocketAdapterInstance;
    hasParams?: true | false;
  },
> = Listener<
  TypeWithDefaults<Properties, "response", ExtractListenerResponseType<T>>,
  Properties["topic"] extends string ? Properties["topic"] : ExtractListenerTopicType<T>,
  Properties["adapter"] extends SocketAdapterInstance ? Properties["adapter"] : ExtractListenerAdapterType<T>,
  Properties["hasParams"] extends true ? true : ExtractListenerHasParamsType<T>
>;
