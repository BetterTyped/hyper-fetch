import { CacheValueType, ClientInstance } from "@hyper-fetch/core";
import { Emitter, Listener, Socket } from "@hyper-fetch/sockets";

import { EmitableCoreEvents, EmitableCustomEvents, DevtoolsPluginOptions, MessageTypes } from "devtools.types";

export class DevtoolsEventHandler {
  client: ClientInstance;
  socket: Socket;
  socketEmitter: Emitter<any, any, any>;
  socketListener: Listener<any, any, any>;
  unmountHooks: any; // TODO FIX ANY
  isConnected: boolean;
  isInitialized: boolean;
  eventQueue: any[] = [];
  connectionName: string;

  constructor(
    client: ClientInstance,
    { socketAddress = "ws://localhost", socketPort = 1234, appName, debug = false }: DevtoolsPluginOptions,
  ) {
    this.isConnected = false;
    this.isInitialized = false;
    this.eventQueue = [];
    this.client = client;
    this.unmountHooks = this.initializeHooks();
    this.connectionName = `HF_DEVTOOLS_PLUGIN_${appName}`;
    this.socket = new Socket({
      url: `${socketAddress}:${socketPort}`,
      adapterOptions: { autoConnect: false },
      reconnect: 100,
      reconnectTime: 3000,
    }).setQueryParams({
      connectionName: this.connectionName,
    });

    this.socketEmitter = this.socket.createEmitter<any>()({ topic: "DEVTOOLS_PLUGIN_EMITTER" });
    this.socketListener = this.socket.createListener<any>()({ topic: "DEVTOOLS_PLUGIN_LISTENER" });
    this.socket.connect();
    this.socket.onDisconnected(() => {
      if (debug) {
        // eslint-disable-next-line no-console
        console.log("[HyperFetch Devtools] disconnected");
      }
    });
    this.socket.onError(({ error }) => {
      if (debug) {
        console.error("[HyperFetch Devtools] error:", error);
      }
    });
    this.socket.onConnected(() => {
      if (debug) {
        // eslint-disable-next-line no-console
        console.log("[HyperFetch Devtools] connected");
      }
      this.isConnected = true;
      this.socketEmitter.emit({
        payload: {
          messageType: MessageTypes.PLUGIN_INITIALIZED,
          eventData: {
            clientOptions: this.client.options,
            adapterOptions: this.client.adapter.options,
          },
          connectionName: this.connectionName,
        },
      });
    });
    this.socketListener.listen((message) => {
      switch (message.data.messageType) {
        case MessageTypes.HF_DEVTOOLS_EVENT: {
          this.handleDevtoolsMessage(message);
          break;
        }
        case MessageTypes.CLIENT_INITIALIZED: {
          this.isInitialized = true;
          while (this.eventQueue.length > 0) {
            const nextEvent = this.eventQueue.shift();
            this.socketEmitter.emit({ payload: nextEvent });
          }
          break;
        }
        default: {
          console.error("NO EVENT TYPE", message);
        }
      }
    });
  }

  sendEvent = (eventType: EmitableCoreEvents | EmitableCustomEvents, data: any) => {
    if (this.isConnected && this.isInitialized) {
      try {
        this.socketEmitter.emit({
          payload: {
            messageType: "HF_APP_EVENT",
            eventType,
            eventData: data,
            connectionName: this.connectionName,
          },
        });
      } catch (e) {
        console.error("ERROR", e);
      }
    } else {
      this.eventQueue.push({
        messageType: "HF_APP_EVENT",
        eventType,
        eventData: data,
        connectionName: this.connectionName,
      });
    }
  };

  handleDevtoolsMessage = (message: any) => {
    switch (message.data.eventType) {
      case EmitableCoreEvents.ON_CACHE_CHANGE: {
        const eventData = message.data.eventData as CacheValueType;
        this.client.cache.update(
          {
            cacheKey: eventData.cacheKey,
            cache: true,
            cacheTime: eventData.cacheTime,
            staleTime: eventData.staleTime,
          },
          eventData,
          true,
        );
        break;
      }
      default: {
        console.error("NO EVENT TYPE", message);
      }
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
      if (!data.isTriggeredExternally) {
        this.sendEvent(EmitableCoreEvents.ON_CACHE_CHANGE, { ...data, isTriggeredExternally: true });
      }
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
