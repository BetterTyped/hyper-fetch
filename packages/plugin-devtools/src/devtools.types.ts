export enum EmitableCoreEvents {
  ON_REQUEST_START = "ON_REQUEST_START",
  ON_REQUEST_REMOVE = "ON_REQUEST_REMOVE",
  ON_REQUEST_PAUSE = "ON_REQUEST_PAUSE",
  ON_RESPONSE = "ON_RESPONSE",
  ON_FETCH_QUEUE_CHANGE = "ON_FETCH_QUEUE_CHANGE",
  ON_FETCH_QUEUE_STATUS_CHANGE = "ON_FETCH_QUEUE_STATUS_CHANGE",
  ON_SUBMIT_QUEUE_CHANGE = "ON_SUBMIT_QUEUE_CHANGE",
  ON_SUBMIT_QUEUE_STATUS_CHANGE = "ON_SUBMIT_QUEUE_STATUS_CHANGE",
  ON_CACHE_CHANGE = "ON_CACHE_CHANGE",
  ON_CACHE_INVALIDATE = "ON_CACHE_INVALIDATE",
  ON_CACHE_DELETE = "ON_CACHE_DELETE",
}

export enum EmitableCustomEvents {
  REQUEST_CREATED = "REQUEST_CREATED",
}

export enum MessageTypes {
  HF_DEVTOOLS_EVENT = "HF_DEVTOOLS_EVENT",
  PLUGIN_INITIALIZED = "PLUGIN_INITIALIZED",
  CLIENT_INITIALIZED = "CLIENT_INITIALIZED",
}

export type DevtoolsPluginOptions = {
  /**
   * Name of your application, it will be displayed in the Hyper Flow app
   */
  appName: string;
  /**
   * URL of the Hyper Flow server
   * Needed only if you change the default port in the Hyper Flow app
   * @default "ws://localhost:2137"
   */
  url?: string;
  /**
   * Enable debug mode logs, so you can see what's happening in plugin
   * @default false
   */
  debug?: boolean;
};
