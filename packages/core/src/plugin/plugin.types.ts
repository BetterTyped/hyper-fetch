import { RequestInstance } from "request";
import { ResponseErrorType, ResponseType, ResponseSuccessType } from "adapter";
import { Plugin } from "plugin";
import {
  ExtractAdapterType,
  ExtractErrorType,
  ExtractResponseType,
  ExtendRequest,
  ExtractClientAdapterType,
} from "types";
import { ClientInstance } from "client";
import { Cache, CacheValueType } from "cache";
import { Dispatcher, QueueDataType, QueueItemType } from "dispatcher";

export type PluginLifecycle = "trigger" | "start" | "success" | "error" | "finished";
export type PluginInstance = Plugin<any, any>;
export type PluginRequest<C extends ClientInstance> = ExtendRequest<
  RequestInstance,
  {
    client: C;
  }
>;

export type PluginOptionsType<PluginData> = {
  /**
   * Name of the plugin
   */
  name: string;
  /**
   * Data stored in a plugin
   */
  data?: PluginData;
};

export type PluginMethods<Client extends ClientInstance> = {
  /* -------------------------------------------------------------------------------------------------
   * Plugin lifecycle
   * -----------------------------------------------------------------------------------------------*/

  onMount?: (data: { client: Client }) => void;
  onUnmount?: (data: { client: Client }) => void;

  /* -------------------------------------------------------------------------------------------------
   * Request lifecycle
   * -----------------------------------------------------------------------------------------------*/

  onRequestCreate?: (data: { request: PluginRequest<Client> }) => void;
  onRequestTrigger?: (data: { request: PluginRequest<Client> }) => void;
  onRequestStart?: (data: { request: PluginRequest<Client> }) => void;
  onRequestSuccess?: (data: {
    response: ResponseSuccessType<
      ExtractResponseType<PluginRequest<Client>>,
      ExtractAdapterType<PluginRequest<Client>>
    >;
    request: PluginRequest<Client>;
  }) => void;
  onRequestError?: (data: {
    response: ResponseErrorType<ExtractErrorType<PluginRequest<Client>>, ExtractAdapterType<PluginRequest<Client>>>;
    request: PluginRequest<Client>;
  }) => void;
  onRequestFinished?: (data: {
    response: ResponseType<
      ExtractResponseType<PluginRequest<Client>>,
      ExtractErrorType<PluginRequest<Client>>,
      ExtractAdapterType<PluginRequest<Client>>
    >;
    request: PluginRequest<Client>;
  }) => void;

  /* -------------------------------------------------------------------------------------------------
   * Cache lifecycle
   * -----------------------------------------------------------------------------------------------*/

  onCacheMount?: (data: { cache: Cache<Client> }) => void;
  onCacheItemChange?: <Requests extends { cacheKey: string; response: any; error: any }>(data: {
    cacheKey: Requests["cacheKey"];
    prevData: CacheValueType<Requests["response"], Requests["error"], ExtractClientAdapterType<Client>> | null;
    newData: CacheValueType<Requests["response"], Requests["error"], ExtractClientAdapterType<Client>>;
    cache: Cache<Client>;
  }) => void;
  onCacheItemDelete?: (data: { cacheKey: string; cache: Cache<Client> }) => void;
  onCacheItemInvalidate?: (data: { cacheKey: string; cache: Cache<Client> }) => void;

  /* -------------------------------------------------------------------------------------------------
   * Dispatcher lifecycle
   * -----------------------------------------------------------------------------------------------*/

  onDispatcherMount?: (data: { dispatcher: Dispatcher }) => void;
  onDispatcherCleared?: (data: { dispatcher: Dispatcher }) => void;
  onDispatcherQueueDrained?: (data: {
    dispatcher: Dispatcher;
    queue: QueueDataType<
      ExtendRequest<
        RequestInstance,
        {
          client: Client;
        }
      >
    >;
  }) => void;
  onDispatcherItemAdded?: (data: {
    dispatcher: Dispatcher;
    queue: QueueDataType<
      ExtendRequest<
        RequestInstance,
        {
          client: Client;
        }
      >
    >;
    queueItem: QueueItemType<
      ExtendRequest<
        RequestInstance,
        {
          client: Client;
        }
      >
    >;
  }) => void;
  onDispatcherItemDeleted?: (data: {
    dispatcher: Dispatcher;
    queue: QueueDataType<
      ExtendRequest<
        RequestInstance,
        {
          client: Client;
        }
      >
    >;
    queueItem: QueueItemType<
      ExtendRequest<
        RequestInstance,
        {
          client: Client;
        }
      >
    >;
  }) => void;
  onDispatcherQueueRunning?: (data: {
    dispatcher: Dispatcher;
    queue: QueueDataType<
      ExtendRequest<
        RequestInstance,
        {
          client: Client;
        }
      >
    >;
    status: "paused" | "stopped" | "running";
  }) => void;
  onDispatcherQueueCreated?: (data: {
    dispatcher: Dispatcher;
    queue: QueueDataType<
      ExtendRequest<
        RequestInstance,
        {
          client: Client;
        }
      >
    >;
  }) => void;
  onDispatcherQueueCleared?: (data: {
    dispatcher: Dispatcher;
    queue: QueueDataType<
      ExtendRequest<
        RequestInstance,
        {
          client: Client;
        }
      >
    >;
  }) => void;

  /* -------------------------------------------------------------------------------------------------
   * App lifecycle
   * -----------------------------------------------------------------------------------------------*/

  onAppFocusChange?: (data: { isFocused: boolean; client: Client }) => void;
  onAppOnlineChange?: (data: { isOnline: boolean; client: Client }) => void;
};

export type PluginMethodParameters<Key extends keyof PluginMethods<Client>, Client extends ClientInstance> = Parameters<
  NonNullable<PluginMethods<Client>[Key]>
>[0];
