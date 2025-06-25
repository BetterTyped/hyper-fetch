export enum CoreEvents {
  ON_CACHE_CHANGE = "ON_CACHE_CHANGE",
  ON_CACHE_INVALIDATION = "ON_CACHE_INVALIDATION",
  ON_CACHE_DELETE = "ON_CACHE_DELETE",
  ON_REQUEST_LOADING = "ON_REQUEST_LOADING",
  ON_FETCH_QUEUE_STATUS_CHANGE = "ON_FETCH_QUEUE_STATUS_CHANGE",
  ON_FETCH_QUEUE_CLEAR = "ON_FETCH_QUEUE_CLEAR",
  ON_SUBMIT_QUEUE_STATUS_CHANGE = "ON_SUBMIT_QUEUE_STATUS_CHANGE",
  ON_SUBMIT_QUEUE_CLEAR = "ON_SUBMIT_QUEUE_CLEAR",
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
