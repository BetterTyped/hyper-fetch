import { RequestInstance } from "request";
import { ResponseErrorType, ResponseType, ResponseSuccessType } from "adapter";
import { Plugin } from "plugin";
import { ExtractAdapterType, ExtractErrorType, ExtractResponseType, ExtendRequest } from "types";
import { ClientInstance } from "client";

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
  onMount?: (data: { client: Client }) => void;
  onUnmount?: (data: { client: Client }) => void;
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
};

export type PluginMethodParameters<Key extends keyof PluginMethods<Client>, Client extends ClientInstance> = Parameters<
  NonNullable<PluginMethods<Client>[Key]>
>[0];
