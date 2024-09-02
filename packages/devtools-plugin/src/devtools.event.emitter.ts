import { ClientInstance } from "@hyper-fetch/core";
import { Emitter, Socket } from "@hyper-fetch/sockets";

import { DevtoolsPluginOptions } from "devtools.types";

export enum EventTypes {
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

export class DevtoolsEventEmitter {
  client: ClientInstance;
  socket: Socket;
  socketEmitter: Emitter<any, any, any>;
  unmountHooks: any;

  static initialize(client: ClientInstance, pluginOptions: DevtoolsPluginOptions): DevtoolsEventEmitter {
    return new DevtoolsEventEmitter(client, pluginOptions);
  }

  constructor(
    client: ClientInstance,
    { socketAddress = "ws://localhost", socketPort = 1234, appName }: DevtoolsPluginOptions,
  ) {
    this.client = client;
    this.unmountHooks = this.initializeHooks();
    this.socket = new Socket({ url: `${socketAddress}:${socketPort}` }).setQuery({
      connectionName: `HF_DEVTOOLS_CLIENT_${appName}}`,
    });
    this.socketEmitter = this.socket.createEmitter<any>()({ topic: "DEVTOOLS_CLIENT_EMITTER_TOPIC" });
  }

  sendEvent = (eventType: EventTypes, data: any) => {
    this.socketEmitter.emit({
      data: {
        eventType,
        eventData: data,
      },
    });
  };

  initializeHooks = () => {
    return {
      unmountOnRequestStart: this.unmountOnRequestStart(),
      unmountOnResponse: this.unmountOnResponse(),
      unmountOnRequestPause: this.unmountOnRequestPause(),
      unmountOnFetchQueueChange: this.unmountOnFetchQueueChange(),
      unmountOnFetchQueueStatusChange: this.unmountOnFetchQueueStatusChange(),
      unmountOnSubmitQueueChange: this.unmountOnSubmitQueueChange(),
      unmountOnSubmitQueueStatusChange: this.unmountOnSubmitQueueStatusChange(),
      unmountOnRemove: this.unmountOnRemove(),
      unmountOnCacheChange: this.unmountOnCacheChange(),
      unmountOnCacheInvalidate: this.unmountOnCacheInvalidate(),
      unmountCacheDelete: this.unmountCacheDelete(),
    };
  };

  unmountOnRequestStart = () => {
    return this.client.requestManager.events.onRequestStart((data) => {
      this.sendEvent(EventTypes.ON_REQUEST_START, data);
    });
  };
  unmountOnResponse = () => {
    return this.client.requestManager.events.onResponse((data) => {
      this.sendEvent(EventTypes.ON_RESPONSE, data);
    });
  };
  unmountOnRequestPause = () => {
    return this.client.requestManager.events.onAbort((data) => {
      this.sendEvent(EventTypes.ON_REQUEST_PAUSE, data);
    });
  };
  unmountOnFetchQueueChange = () => {
    return this.client.fetchDispatcher.events.onQueueChange((data) => {
      this.sendEvent(EventTypes.ON_FETCH_QUEUE_CHANGE, data);
    });
  };
  unmountOnFetchQueueStatusChange = () => {
    return this.client.fetchDispatcher.events.onQueueStatusChange((data) => {
      this.sendEvent(EventTypes.ON_FETCH_QUEUE_STATUS_CHANGE, data);
    });
  };
  unmountOnSubmitQueueChange = () => {
    return this.client.submitDispatcher.events.onQueueChange((data) => {
      this.sendEvent(EventTypes.ON_SUBMIT_QUEUE_CHANGE, data);
    });
  };
  unmountOnSubmitQueueStatusChange = () => {
    return this.client.submitDispatcher.events.onQueueStatusChange((data) => {
      this.sendEvent(EventTypes.ON_SUBMIT_QUEUE_STATUS_CHANGE, data);
    });
  };
  unmountOnRemove = () => {
    return this.client.requestManager.events.onRemove((data) => {
      this.sendEvent(EventTypes.ON_REQUEST_REMOVE, data);
    });
  };
  unmountOnCacheChange = () => {
    return this.client.cache.events.onData((data) => {
      this.sendEvent(EventTypes.ON_CACHE_CHANGE, data);
    });
  };
  unmountOnCacheInvalidate = () => {
    return this.client.cache.events.onInvalidate(() => {
      // TODO - on invalidate <missing data>
      this.sendEvent(EventTypes.ON_CACHE_INVALIDATE, {});
    });
  };

  unmountCacheDelete = () => {
    return this.client.cache.events.onDelete(() => {
      this.sendEvent(EventTypes.ON_CACHE_DELETE, {});
    });
  };

  unmountHooksFromClient = () => {
    this.unmountHooks.unmountOnRequestStart();
    this.unmountHooks.unmountOnResponse();
    this.unmountHooks.unmountOnRequestPause();
    this.unmountHooks.unmountOnFetchQueueChange();
    this.unmountHooks.unmountOnFetchQueueStatusChange();
    this.unmountHooks.unmountOnSubmitQueueChange();
    this.unmountHooks.unmountOnSubmitQueueStatusChange();
    this.unmountHooks.unmountOnRemove();
    this.unmountHooks.unmountOnCacheChange();
    this.unmountHooks.unmountOnCacheInvalidate();
    this.unmountHooks.unmountCacheDelete();
  };
}
