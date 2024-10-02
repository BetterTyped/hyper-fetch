import { PluginMethodParameters, PluginMethods, PluginOptionsType } from "plugin";
import { ClientInstance } from "client";

export class Plugin<Client extends ClientInstance = ClientInstance, PluginData = void> {
  public name: string;
  public data: PluginData;

  public client: Client | undefined = undefined;

  private pluginMethods: Partial<PluginMethods<Client>> = {};

  constructor(public config: PluginOptionsType<PluginData>) {
    this.name = config.name;
  }

  setClient = (client: Client) => {
    this.client = client;
  };

  triggerMethod = <Key extends keyof PluginMethods<Client>>(method: Key, data: PluginMethodParameters<Key, Client>) => {
    this.pluginMethods[method]?.(data as any);
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
}
