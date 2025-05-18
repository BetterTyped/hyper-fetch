import { CacheValueType, ClientInstance } from "@hyper-fetch/core";
import { Emitter, Listener, Socket } from "@hyper-fetch/sockets";

import { DevtoolsPluginOptions, MessageTypes } from "devtools.types";

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

  constructor(client: ClientInstance, { appName, url = "ws://localhost:2137", debug = false }: DevtoolsPluginOptions) {
    this.isConnected = false;
    this.isInitialized = false;
    this.eventQueue = [];
    this.client = client;
    this.unmountHooks = this.initializeHooks();
    this.connectionName = appName;
    this.socket = new Socket({
      url,
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

  sendEvent =
    (eventSource: "requestManager" | "appManager" | "cache" | "submitDispatcher" | "fetchDispatcher" | "customEvent") =>
    (eventName: string, data: any, isTriggeredExternally: boolean) => {
      if (this.isConnected && this.isInitialized) {
        try {
          this.socketEmitter.emit({
            payload: {
              messageType: "HF_APP_EVENT",
              eventSource,
              eventName: eventName,
              eventData: { ...data, isTriggeredExternally },
              connectionName: this.connectionName,
            },
          });
        } catch (e) {
          console.error("ERROR", e);
        }
      } else {
        this.eventQueue.push({
          messageType: "HF_APP_EVENT",
          payload: {
            messageType: "HF_APP_EVENT",
            parent,
            eventName: eventName,
            eventData: { ...data, isTriggeredExternally },
            connectionName: this.connectionName,
          },
          eventData: data,
          connectionName: this.connectionName,
        });
      }
    };

  // sendEvent = (eventType: EmitableCoreEvents | EmitableCustomEvents, data: any) => {
  //   if (this.isConnected && this.isInitialized) {
  //     try {
  //       this.socketEmitter.emit({
  //         payload: {
  //           messageType: "HF_APP_EVENT",
  //           eventType,
  //           eventData: data,
  //           connectionName: this.connectionName,
  //         },
  //       });
  //     } catch (e) {
  //       console.error("ERROR", e);
  //     }
  //   } else {
  //     this.eventQueue.push({
  //       messageType: "HF_APP_EVENT",
  //       eventType,
  //       eventData: data,
  //       connectionName: this.connectionName,
  //     });
  //   }
  // };

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
    this.client.requestManager.emitter.onEmit(this.sendEvent("requestManager"));
    this.client.appManager.emitter.onEmit(this.sendEvent("appManager"));
    this.client.cache.emitter.onEmit(this.sendEvent("cache"));
    this.client.fetchDispatcher.emitter.onEmit(this.sendEvent("fetchDispatcher"));
    this.client.submitDispatcher.emitter.onEmit(this.sendEvent("submitDispatcher"));
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
