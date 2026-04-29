import type { PluginMethodParameters, PluginMethods, PluginOptionsType } from "plugin";
import type { ClientInstance } from "client";

/**
 * Base class for plugins that hook into the request, cache, dispatcher, and adapter lifecycle.
 * Extend this to build devtools, logging, analytics, or custom side-effect plugins.
 */
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

  /** Bind the plugin to a client instance. Called automatically when the plugin is added via `client.addPlugin()`. */
  initialize = (client: Client) => {
    this.client = client;
    return this;
  };

  /** Invoke a registered plugin method by name. Used internally by the client to dispatch lifecycle events. */
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

  /** Called when the dispatcher storage is fully cleared */
  onDispatcherCleared = (callback: PluginMethods<Client>["onDispatcherCleared"]) => {
    this.pluginMethods.onDispatcherCleared = callback;
    return this;
  };

  /** Called when a dispatcher queue has no more pending requests */
  onDispatcherQueueDrained = (callback: PluginMethods<Client>["onDispatcherQueueDrained"]) => {
    this.pluginMethods.onDispatcherQueueDrained = callback;
    return this;
  };

  /** Called when a dispatcher queue transitions to running, paused, or stopped */
  onDispatcherQueueRunning = (callback: PluginMethods<Client>["onDispatcherQueueRunning"]) => {
    this.pluginMethods.onDispatcherQueueRunning = callback;
    return this;
  };

  /** Called when a new item is added to a dispatcher queue */
  onDispatcherItemAdded = (callback: PluginMethods<Client>["onDispatcherItemAdded"]) => {
    this.pluginMethods.onDispatcherItemAdded = callback;
    return this;
  };

  /** Called when an item is removed from a dispatcher queue */
  onDispatcherItemDeleted = (callback: PluginMethods<Client>["onDispatcherItemDeleted"]) => {
    this.pluginMethods.onDispatcherItemDeleted = callback;
    return this;
  };

  /** Called when a new dispatcher queue is created */
  onDispatcherQueueCreated = (callback: PluginMethods<Client>["onDispatcherQueueCreated"]) => {
    this.pluginMethods.onDispatcherQueueCreated = callback;
    return this;
  };

  /** Called when an entire dispatcher queue is cleared */
  onDispatcherQueueCleared = (callback: PluginMethods<Client>["onDispatcherQueueCleared"]) => {
    this.pluginMethods.onDispatcherQueueCleared = callback;
    return this;
  };

  /* -------------------------------------------------------------------------------------------------
   * Cache lifecycle
   * -----------------------------------------------------------------------------------------------*/

  /** Called when a cache entry is created or updated */
  onCacheItemChange = (callback: PluginMethods<Client>["onCacheItemChange"]) => {
    this.pluginMethods.onCacheItemChange = callback;
    return this;
  };

  /** Called when a cache entry is deleted */
  onCacheItemDelete = (callback: PluginMethods<Client>["onCacheItemDelete"]) => {
    this.pluginMethods.onCacheItemDelete = callback;
    return this;
  };

  /* -------------------------------------------------------------------------------------------------
   * Adapter lifecycle
   * -----------------------------------------------------------------------------------------------*/

  /** Called when the adapter fetcher is about to execute a request */
  onAdapterFetch = (callback: PluginMethods<Client>["onAdapterFetch"]) => {
    this.pluginMethods.onAdapterFetch = callback;
    return this;
  };
}
