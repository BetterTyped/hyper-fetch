import { ExtractUrlParams, EmptyTypes, TypeWithDefaults } from "@hyper-fetch/core";

import { SocketAdapterInstance } from "adapter";
import { Listener } from "listener";
import { SocketInstance } from "socket";
import {
  ExtractListenerHasParamsType,
  ExtractListenerTopicType,
  ExtractListenerResponseType,
  ExtractAdapterListenerOptionsType,
  ExtractAdapterExtraType,
  ExtractListenerSocketType,
  ExtractSocketAdapterType,
} from "types";

export type ListenerInstanceProperties = {
  response?: any;
  topic?: string;
  socket?: SocketInstance;
  hasParams?: boolean;
};

export type ListenerInstance<ListenerProperties extends ListenerInstanceProperties = {}> = Listener<
  TypeWithDefaults<ListenerProperties, "response", any>,
  TypeWithDefaults<ListenerProperties, "topic", any>,
  TypeWithDefaults<ListenerProperties, "socket", SocketInstance>,
  TypeWithDefaults<ListenerProperties, "hasParams", any>
>;

export type ListenerOptionsType<Topic extends string, AdapterType extends SocketAdapterInstance> = {
  topic: Topic;
  options?: ExtractAdapterListenerOptionsType<AdapterType>;
};

export type ListenerConfigurationType<Params, Topic extends string, Socket extends SocketInstance> = {
  params?: Params;
} & Partial<ListenerOptionsType<Topic, ExtractSocketAdapterType<Socket>>>;

export type ListenerParamsOptionsType<Listener extends ListenerInstance> =
  ExtractListenerHasParamsType<Listener> extends false
    ? {
        params: ExtractUrlParams<ExtractListenerTopicType<Listener>>;
      }
    : {
        params?: never;
      };

export type ListenType<Listener extends ListenerInstance, Socket extends SocketInstance> =
  ExtractUrlParams<ExtractListenerTopicType<Listener>> extends EmptyTypes
    ? (
        callback: ListenerCallbackType<ExtractSocketAdapterType<Socket>, ExtractListenerResponseType<Listener>>,
      ) => () => void
    : ExtractListenerHasParamsType<Listener> extends true
      ? (
          callback: ListenerCallbackType<ExtractSocketAdapterType<Socket>, ExtractListenerResponseType<Listener>>,
        ) => () => void
      : (
          callback: ListenerCallbackType<ExtractSocketAdapterType<Socket>, ExtractListenerResponseType<Listener>>,
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
    socket?: SocketInstance;
    hasParams?: true | false;
  },
> = Listener<
  TypeWithDefaults<Properties, "response", ExtractListenerResponseType<T>>,
  Properties["topic"] extends string ? Properties["topic"] : ExtractListenerTopicType<T>,
  Properties["socket"] extends SocketInstance ? Properties["socket"] : ExtractListenerSocketType<T>,
  Properties["hasParams"] extends true ? true : ExtractListenerHasParamsType<T>
>;
