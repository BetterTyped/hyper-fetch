export enum CoreEvents {
  ON_CACHE_CHANGE = "ON_CACHE_CHANGE",
}

export enum CustomEvents {
  REQUEST_CREATED = "REQUEST_CREATED",
}

export enum EventSourceType {
  REQUEST_MANAGER = "requestManager",
  APP_MANAGER = "appManager",
  CACHE = "cache",
  SUBMIT_DISPATCHER = "submitDispatcher",
  FETCH_DISPATCHER = "fetchDispatcher",
  CUSTOM_EVENT = "customEvent",
}

/*
 * Internal communication events used to communicate state between plugin and devtools app
 * */
export enum InternalEvents {
  PLUGIN_INITIALIZED = "PLUGIN_INITIALIZED",
  PLUGIN_HANGUP = "PLUGIN_HANGUP",
  APP_INITIALIZED = "APP_INITIALIZED",
}
