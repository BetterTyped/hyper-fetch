import { CacheValueType, ClientInstance } from "@hyper-fetch/core";
import { Emitter, Listener, Socket } from "@hyper-fetch/sockets";

import { CoreEvents, EventSourceType, InternalEvents } from "./types/events.types";
import { HFEventMessage, MessageOrigin, MessageType, PluginInternalMessagePayload } from "./types/messages.types";
import { DevtoolsPluginOptions } from "./types/plugin.types";

export class DevtoolsEventHandler {
  client: ClientInstance;
  socket: Socket;
  // TODO - fix type, it can be either internal or simply an event
  socketEmitter: Emitter<PluginInternalMessagePayload, any, any>;
  socketListener: Listener<any, any, any>;
  unmountHooks: any; // TODO FIX ANY
  isConnected: boolean;
  isInitialized: boolean;
  eventQueue: any[] = [];
  connectionName: string;
  environment: string;

  constructor(
    client: ClientInstance,
    { appName, url = "ws://localhost:2137", debug = false, environment }: DevtoolsPluginOptions,
  ) {
    this.isConnected = false;
    this.isInitialized = false;
    this.eventQueue = [];
    this.client = client;
    this.unmountHooks = this.initializeHooks();
    this.connectionName = appName;
    this.environment = environment || appName;
    this.socket = new Socket({
      url,
      adapterOptions: { autoConnect: false },
      reconnect: 100,
      reconnectTime: 3000,
    }).setQueryParams({
      connectionName: this.connectionName,
      origin: MessageOrigin.PLUGIN,
    });

    // TODO - move topic names?
    this.socketEmitter = this.socket.createEmitter<PluginInternalMessagePayload>()({
      topic: "DEVTOOLS_PLUGIN_EMITTER",
    });
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
      // TODO - fix type
      this.socketEmitter.emit({
        payload: {
          messageType: MessageType.INTERNAL,
          eventType: InternalEvents.PLUGIN_INITIALIZED,
          eventData: {
            clientOptions: this.client.options,
            adapterOptions: this.client.adapter.options,
            environment: this.environment,
          },
          connectionName: this.connectionName,
          origin: MessageOrigin.PLUGIN,
        },
      });
    });
    this.socketListener.listen((message) => {
      switch (message.data.messageType) {
        case MessageType.EVENT: {
          this.handleEvent(message);
          break;
        }
        case MessageType.INTERNAL: {
          if (message.data.eventType === InternalEvents.APP_INITIALIZED) {
            this.isInitialized = true;
            while (this.eventQueue.length > 0) {
              const nextEvent = this.eventQueue.shift();
              this.socketEmitter.emit({ payload: nextEvent });
            }
          } else {
            console.error(`[HyperFetch Plugin Devtools] - Unknown event type ${message.data.messageType}`);
          }
          break;
        }
        default: {
          console.error(`[HyperFetch Plugin Devtools] - Unknown Message Type`, message);
        }
      }
    });
  }

  sendEvent = (eventSource: EventSourceType) => (eventName: string, data: any, isTriggeredExternally: boolean) => {
    if (this.isConnected && this.isInitialized) {
      try {
        this.socketEmitter.emit({
          payload: {
            messageType: MessageType.EVENT,
            eventSource,
            connectionName: this.connectionName,
            eventName,
            eventData: { ...data, isTriggeredExternally, environment: this.environment },
            origin: MessageOrigin.PLUGIN,
          },
        });
      } catch (e) {
        console.error("ERROR", e);
      }
    } else {
      // TODO - add tests
      this.eventQueue.push({
        messageType: MessageType.EVENT,
        eventSource,
        connectionName: this.connectionName,
        eventName,
        eventData: { ...data, isTriggeredExternally, environment: this.environment },
        origin: MessageOrigin.PLUGIN,
      });
    }
  };

  handleEvent = (message: HFEventMessage) => {
    switch (message.data.eventType) {
      case CoreEvents.ON_CACHE_CHANGE: {
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
        console.error(`[HyperFetch Plugin Devtools] - Unknown event type`, message.data.messageType);
      }
    }
  };

  initializeHooks = () => {
    // TODO - add unmount ?
    this.client.requestManager.emitter.onEmit(this.sendEvent(EventSourceType.REQUEST_MANAGER));
    this.client.appManager.emitter.onEmit(this.sendEvent(EventSourceType.APP_MANAGER));
    this.client.cache.emitter.onEmit(this.sendEvent(EventSourceType.CACHE));
    this.client.fetchDispatcher.emitter.onEmit(this.sendEvent(EventSourceType.FETCH_DISPATCHER));
    this.client.submitDispatcher.emitter.onEmit(this.sendEvent(EventSourceType.SUBMIT_DISPATCHER));
    //
    // unmountOnCacheChange = () => {
    //   return this.client.cache.events.onData((data) => {
    //     if (!data.isTriggeredExternally) {
    //       this.hookOnEvent(EmitableCoreEvents.ON_CACHE_CHANGE, { ...data, isTriggeredExternally: true });
    //     }
    //   });
    // };
  };
}
