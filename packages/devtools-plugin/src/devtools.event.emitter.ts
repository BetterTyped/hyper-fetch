import { ClientInstance, RequestInstance } from "@hyper-fetch/core";
import { Emitter, Socket } from "@hyper-fetch/sockets";
import { EventEmitter } from "events";

import { EmitableCoreEvents, EmitableCustomEvents, DevtoolsPluginOptions } from "devtools.types";

export class DevtoolsEventEmitter {
  client: ClientInstance;
  socket: Socket;
  socketEmitter: Emitter<any, any, any>;
  onCreateRequestEmitter: EventEmitter;
  unmountHooks: any;
  isConnected: boolean;
  eventQueue: any[] = [];

  static initialize(
    client: ClientInstance,
    pluginOptions: DevtoolsPluginOptions,
    onCreateRequestEmitter: EventEmitter,
  ): DevtoolsEventEmitter {
    return new DevtoolsEventEmitter(client, pluginOptions, onCreateRequestEmitter);
  }

  constructor(
    client: ClientInstance,
    { socketAddress = "ws://localhost", socketPort = 1234, appName }: DevtoolsPluginOptions,
    onCreateRequestEmitter: EventEmitter,
  ) {
    this.isConnected = false;
    this.eventQueue = [];
    this.client = client;
    this.onCreateRequestEmitter = onCreateRequestEmitter;
    this.unmountHooks = this.initializeHooks();
    this.socket = new Socket({ url: `${socketAddress}:${socketPort}` }).setQuery({
      connectionName: `HF_DEVTOOLS_CLIENT_${appName}}`,
    });
    this.socketEmitter = this.socket.createEmitter<any>()({ topic: "DEVTOOLS_CLIENT_EMITTER_TOPIC" });
    this.socket.onConnected(() => {
      this.isConnected = true;
      while (this.eventQueue.length > 0) {
        // TODO - optimize with Dequeue to have O(1)
        // TODO - add timestamps for particular events.
        const nextEvent = this.eventQueue.shift();
        this.socketEmitter.emit({ data: nextEvent });
      }
    });
  }

  sendEvent = (eventType: EmitableCoreEvents | EmitableCustomEvents, data: any) => {
    if (this.isConnected) {
      this.socketEmitter.emit({
        data: {
          eventType,
          eventData: data,
        },
      });
    } else {
      this.eventQueue.push({ eventType, eventData: data });
    }
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
      unmountOnCreateRequest: this.unmountOnCreateRequest(),
    };
  };

  unmountOnRequestStart = () => {
    return this.client.requestManager.events.onRequestStart((data) => {
      this.sendEvent(EmitableCoreEvents.ON_REQUEST_START, data);
    });
  };
  unmountOnResponse = () => {
    return this.client.requestManager.events.onResponse((data) => {
      this.sendEvent(EmitableCoreEvents.ON_RESPONSE, data);
    });
  };
  unmountOnRequestPause = () => {
    return this.client.requestManager.events.onAbort((data) => {
      this.sendEvent(EmitableCoreEvents.ON_REQUEST_PAUSE, data);
    });
  };
  unmountOnFetchQueueChange = () => {
    return this.client.fetchDispatcher.events.onQueueChange((data) => {
      this.sendEvent(EmitableCoreEvents.ON_FETCH_QUEUE_CHANGE, data);
    });
  };
  unmountOnFetchQueueStatusChange = () => {
    return this.client.fetchDispatcher.events.onQueueStatusChange((data) => {
      this.sendEvent(EmitableCoreEvents.ON_FETCH_QUEUE_STATUS_CHANGE, data);
    });
  };
  unmountOnSubmitQueueChange = () => {
    return this.client.submitDispatcher.events.onQueueChange((data) => {
      this.sendEvent(EmitableCoreEvents.ON_SUBMIT_QUEUE_CHANGE, data);
    });
  };
  unmountOnSubmitQueueStatusChange = () => {
    return this.client.submitDispatcher.events.onQueueStatusChange((data) => {
      this.sendEvent(EmitableCoreEvents.ON_SUBMIT_QUEUE_STATUS_CHANGE, data);
    });
  };
  unmountOnRemove = () => {
    return this.client.requestManager.events.onRemove((data) => {
      this.sendEvent(EmitableCoreEvents.ON_REQUEST_REMOVE, data);
    });
  };
  unmountOnCacheChange = () => {
    return this.client.cache.events.onData((data) => {
      this.sendEvent(EmitableCoreEvents.ON_CACHE_CHANGE, data);
    });
  };
  unmountOnCacheInvalidate = () => {
    return this.client.cache.events.onInvalidate(() => {
      // TODO - on invalidate <missing data>
      this.sendEvent(EmitableCoreEvents.ON_CACHE_INVALIDATE, {});
    });
  };

  unmountCacheDelete = () => {
    return this.client.cache.events.onDelete(() => {
      this.sendEvent(EmitableCoreEvents.ON_CACHE_DELETE, {});
    });
  };

  unmountOnCreateRequest = () => {
    return this.onCreateRequestEmitter.on(EmitableCustomEvents.REQUEST_CREATED, (requestMap: RequestInstance[]) => {
      this.sendEvent(EmitableCustomEvents.REQUEST_CREATED, requestMap);
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
    this.unmountHooks.unmountOnCreateRequest();
  };
}
