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
  PLUGIN_HANGUP = "PLUGIN_HANGUP",
}

export enum MessageType {
  PLUGIN_INITIALIZED = "PLUGIN_INITIALIZED",
  DEVTOOLS_PLUGIN_INIT = "DEVTOOLS_PLUGIN_INIT",
  DEVTOOLS_PLUGIN_CONFIRM = "DEVTOOLS_PLUGIN_CONFIRM",
  DEVTOOLS_PLUGIN_HANGUP = "DEVTOOLS_PLUGIN_HANGUP",
  DEVTOOLS_PLUGIN_RECONNECTED = "DEVTOOLS_PLUGIN_RECONNECTED",
  HF_APP_EVENT = "HF_APP_EVENT",
  HF_DEVTOOLS_EVENT = "HF_DEVTOOLS_EVENT",
}

export type BaseMessage = {
  data: {
    messageType: MessageType;
    connectionName: string;
    eventType?: EmitableCoreEvents | EmitableCustomEvents;
    eventData?: any;
  };
};

export type DevtoolsClientHandshakeMessage = {
  data: {
    messageType:
      | MessageType.DEVTOOLS_PLUGIN_INIT
      | MessageType.DEVTOOLS_PLUGIN_CONFIRM
      | MessageType.PLUGIN_INITIALIZED;
    connectionName: string;
    eventData: any;
  };
};

export type HFEventMessage = {
  data: {
    messageType: MessageType.HF_APP_EVENT | MessageType.HF_DEVTOOLS_EVENT;
    connectionName: string;
    eventType: EmitableCoreEvents | EmitableCustomEvents;
    eventData: any;
  };
};

export type MessageTypes = DevtoolsClientHandshakeMessage | HFEventMessage;
