import { PluginMethodParameters, PluginMethods, PluginOptionsType } from "plugin";
import { ClientInstance } from "client";

export class Plugin<Client extends ClientInstance = ClientInstance, PluginData = void> {
  public name: string;
  public data: PluginData;

  public client: Client | undefined = undefined;

  private pluginMethods: Partial<PluginMethods<Client>> = {};

  constructor(public config: PluginOptionsType<PluginData>) {
    this.name = config.name;
    if (config.data) {
      this.data = config.data;
    }
  }

  initialize = (client: Client) => {
    this.client = client;
    return this;
  };

  trigger = <Key extends keyof PluginMethods<Client>>(method: Key, data: PluginMethodParameters<Key, Client>) => {
    const callback = this.pluginMethods[method];
    if (callback) {
      callback(data as any);
    }
  };

  /* -------------------------------------------------------------------------------------------------
   * Plugin lifecycle
   * -----------------------------------------------------------------------------------------------*/

  /**
   * Callback that will be executed when plugin is mounted
   */
  onMount = (callback: PluginMethods<Client>["onMount"]) => {
    this.pluginMethods.onMount = callback;
    return this;
  };

  /**
   * Callback that will be executed when plugin is unmounted
   */
  onUnmount = (callback: PluginMethods<Client>["onUnmount"]) => {
    this.pluginMethods.onUnmount = callback;
    return this;
  };

  /* -------------------------------------------------------------------------------------------------
   * Request lifecycle
   * -----------------------------------------------------------------------------------------------*/

  /**
   * Callback that will be executed when request is created
   */
  onRequestCreate = (callback: PluginMethods<Client>["onRequestCreate"]) => {
    this.pluginMethods.onRequestCreate = callback;
    return this;
  };
  /**
   * Callback that will be executed when request gets triggered
   */
  onRequestTrigger = (callback: PluginMethods<Client>["onRequestTrigger"]) => {
    this.pluginMethods.onRequestTrigger = callback;
    return this;
  };
  /**
   * Callback that will be executed when request starts
   */
  onRequestStart = (callback: PluginMethods<Client>["onRequestStart"]) => {
    this.pluginMethods.onRequestStart = callback;
    return this;
  };
  /**
   * Callback that will be executed when response is successful
   */
  onRequestSuccess = (callback: PluginMethods<Client>["onRequestSuccess"]) => {
    this.pluginMethods.onRequestSuccess = callback;
    return this;
  };
  /**
   * Callback that will be executed when response is failed
   */
  onRequestError = (callback: PluginMethods<Client>["onRequestError"]) => {
    this.pluginMethods.onRequestError = callback;
    return this;
  };
  /**
   * Callback that will be executed when response is finished
   */
  onRequestFinished = (callback: PluginMethods<Client>["onRequestFinished"]) => {
    this.pluginMethods.onRequestFinished = callback;
    return this;
  };

  /* -------------------------------------------------------------------------------------------------
   * Dispatcher lifecycle
   * -----------------------------------------------------------------------------------------------*/

  onDispatcherCleared = (callback: PluginMethods<Client>["onDispatcherCleared"]) => {
    this.pluginMethods.onDispatcherCleared = callback;
    return this;
  };

  onDispatcherQueueDrained = (callback: PluginMethods<Client>["onDispatcherQueueDrained"]) => {
    this.pluginMethods.onDispatcherQueueDrained = callback;
    return this;
  };

  onDispatcherQueueRunning = (callback: PluginMethods<Client>["onDispatcherQueueRunning"]) => {
    this.pluginMethods.onDispatcherQueueRunning = callback;
    return this;
  };

  onDispatcherItemAdded = (callback: PluginMethods<Client>["onDispatcherItemAdded"]) => {
    this.pluginMethods.onDispatcherItemAdded = callback;
    return this;
  };

  onDispatcherItemDeleted = (callback: PluginMethods<Client>["onDispatcherItemDeleted"]) => {
    this.pluginMethods.onDispatcherItemDeleted = callback;
    return this;
  };

  onDispatcherQueueCreated = (callback: PluginMethods<Client>["onDispatcherQueueCreated"]) => {
    this.pluginMethods.onDispatcherQueueCreated = callback;
    return this;
  };

  onDispatcherQueueCleared = (callback: PluginMethods<Client>["onDispatcherQueueCleared"]) => {
    this.pluginMethods.onDispatcherQueueCleared = callback;
    return this;
  };

  /* -------------------------------------------------------------------------------------------------
   * Cache lifecycle
   * -----------------------------------------------------------------------------------------------*/

  onCacheItemChange = (callback: PluginMethods<Client>["onCacheItemChange"]) => {
    this.pluginMethods.onCacheItemChange = callback;
    return this;
  };

  onCacheItemDelete = (callback: PluginMethods<Client>["onCacheItemDelete"]) => {
    this.pluginMethods.onCacheItemDelete = callback;
    return this;
  };
}
