import {
  ClientInstance,
  getCacheEvents,
  getDispatcherEvents,
  getRequestManagerEvents,
  LoggerMethods,
} from "@hyper-fetch/core";
import { Emitter, Listener, Socket } from "@hyper-fetch/sockets";

import { CoreEvents, EventSourceType, InternalEvents } from "./types/events.types";
import {
  HFEventMessagePayload,
  MessageOrigin,
  MessageType,
  PluginInternalMessagePayload,
} from "./types/messages.types";
import { DevtoolsPluginOptions } from "./types/plugin.types";
import { SocketTopics } from "./types/topics";

type EventData<
  Events extends (...args: any) => Record<string, (...args: any) => any>,
  Key extends keyof ReturnType<Events>,
> = Parameters<Parameters<ReturnType<Events>[Key]>[0]>[0];

export class DevtoolsEventHandler {
  client: ClientInstance;
  socket: Socket;
  // TODO - fix type, it can be either internal or simply an event
  socketEmitter: Emitter<PluginInternalMessagePayload | HFEventMessagePayload, any, any>;
  socketListener: Listener<any, any, any>;
  unmountHooks: any; // TODO FIX ANY
  isConnected: boolean;
  isInitialized: boolean;
  eventQueue: HFEventMessagePayload[] = [];
  connectionName: string;
  environment: string;
  logger: LoggerMethods;

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

    this.logger = client.loggerManager.initialize(client, "DevtoolsEventHandler");

    this.socketEmitter = this.socket.createEmitter<PluginInternalMessagePayload>()({
      topic: SocketTopics.PLUGIN_EMITTER,
    });
    this.socketListener = this.socket.createListener<any>()({ topic: SocketTopics.PLUGIN_LISTENER });
    this.socket.connect();
    this.socket.onDisconnected(() => {
      if (debug) {
        this.logger.info({ title: "Disconnected", type: "system", extra: {} });
      }
    });
    this.socket.onError(({ error }) => {
      if (debug) {
        this.logger.error({ title: "Error", type: "system", extra: { error } });
      }
    });
    this.socket.onConnected(() => {
      if (debug) {
        this.logger.info({ title: "Connected", type: "system", extra: {} });
      }
      this.isConnected = true;
      this.socketEmitter.emit({
        payload: {
          messageType: MessageType.INTERNAL,
          eventType: InternalEvents.PLUGIN_INITIALIZED,
          clientOptions: this.client.options,
          adapterOptions: this.client.adapter.options,
          environment: this.environment,
          connectionName: this.connectionName,
          origin: MessageOrigin.PLUGIN,
        },
      });
    });
    this.socketListener.listen((message) => {
      switch (message.data.messageType) {
        case MessageType.EVENT: {
          // TODO - cover all types from any to specific types
          // Cache
          if (message.data.eventSource === EventSourceType.CACHE) {
            if (message.data.eventName === CoreEvents.ON_CACHE_CHANGE) {
              const data = message.data.eventData as EventData<typeof getCacheEvents, "onData">;
              client.cache.storage.set(data.cacheKey, data);
              client.cache.events.emitCacheData(data, true);
            }
            if (message.data.eventName === CoreEvents.ON_CACHE_INVALIDATION) {
              const data = message.data.eventData as EventData<typeof getCacheEvents, "onInvalidate">;
              client.cache.events.emitInvalidation(data, true);
            }
            if (message.data.eventName === CoreEvents.ON_CACHE_DELETE) {
              const data = message.data.eventData as EventData<typeof getCacheEvents, "onDelete">;
              client.cache.storage.delete(data);
              client.cache.events.emitDelete(data, true);
            }
          }
          // Request manager
          if (message.data.eventSource === EventSourceType.REQUEST_MANAGER) {
            if (message.data.eventName === CoreEvents.ON_REQUEST_LOADING) {
              const data = message.data.eventData as EventData<typeof getRequestManagerEvents, "onLoading">;
              client.requestManager.events.emitLoading(data, true);
            }
          }
          // Fetch dispatcher
          if (message.data.eventSource === EventSourceType.FETCH_DISPATCHER) {
            if (message.data.eventName === CoreEvents.ON_FETCH_QUEUE_STATUS_CHANGE) {
              const data = message.data.eventData as EventData<typeof getDispatcherEvents, "onQueueStatusChange">;

              console.log("ON_FETCH_QUEUE_STATUS_CHANGE", data);
              if (data.stopped) {
                client.fetchDispatcher.stop(data.queryKey);
              } else {
                client.fetchDispatcher.start(data.queryKey);
              }
            }
            if (message.data.eventName === CoreEvents.ON_FETCH_QUEUE_CLEAR) {
              client.fetchDispatcher.clearQueue(message.data.eventData.queryKey);
            }
          }
          // Submit dispatcher
          if (message.data.eventSource === EventSourceType.SUBMIT_DISPATCHER) {
            if (message.data.eventName === CoreEvents.ON_SUBMIT_QUEUE_STATUS_CHANGE) {
              const data = message.data.eventData as EventData<typeof getDispatcherEvents, "onQueueStatusChange">;

              console.log("ON_SUBMIT_QUEUE_STATUS_CHANGE", data);
              if (data.stopped) {
                client.submitDispatcher.stop(data.queryKey);
              } else {
                client.submitDispatcher.start(data.queryKey);
              }
            }
            if (message.data.eventName === CoreEvents.ON_SUBMIT_QUEUE_CLEAR) {
              const data = message.data.eventData as EventData<typeof getDispatcherEvents, "onDrained">;
              client.submitDispatcher.clearQueue(data.queryKey);
            }
          }
          break;
        }
        case MessageType.INTERNAL: {
          if (message.data.eventType === InternalEvents.APP_INITIALIZED) {
            this.isInitialized = true;
            while (this.eventQueue.length > 0) {
              const nextEvent = this.eventQueue.shift();
              if (nextEvent) {
                this.socketEmitter.emit({ payload: nextEvent });
              }
            }
          } else {
            this.logger.error({
              title: `Unknown event type ${message.data.messageType}`,
              type: "system",
              extra: { message },
            });
          }
          break;
        }
        default: {
          this.logger.error({
            title: `Unknown Message Type`,
            type: "system",
            extra: { message },
          });
        }
      }
    });
  }

  sendEvent = ({
    eventSource,
    eventName,
    data,
    isTriggeredExternally = false,
  }: {
    eventSource: EventSourceType;
    eventName: string;
    data: any;
    isTriggeredExternally: boolean | undefined;
  }) => {
    if (isTriggeredExternally) {
      // We don't want to return the events sent from HyperFlow to the plugin
      // It would cause infinite loop and conflicts because of latency
      return;
    }

    if (this.isConnected && this.isInitialized) {
      try {
        this.socketEmitter.emit({
          payload: {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            messageType: MessageType.EVENT,
            eventSource,
            connectionName: this.connectionName,
            eventName,
            isTriggeredExternally: false,
            environment: this.environment,
            eventData: data,
            origin: MessageOrigin.PLUGIN,
          },
        });
      } catch (e) {
        console.error("ERROR", e);
      }
    } else {
      this.eventQueue.push({
        messageType: MessageType.EVENT,
        eventSource,
        connectionName: this.connectionName,
        eventName,
        isTriggeredExternally: false,
        environment: this.environment,
        eventData: data,
        origin: MessageOrigin.PLUGIN,
      });
    }
  };

  initializeHooks = () => {
    this.client.requestManager.emitter.onEmit((eventName, data, isTriggeredExternally) =>
      this.sendEvent({ eventSource: EventSourceType.REQUEST_MANAGER, eventName, data, isTriggeredExternally }),
    );
    this.client.appManager.emitter.onEmit((eventName, data, isTriggeredExternally) =>
      this.sendEvent({ eventSource: EventSourceType.APP_MANAGER, eventName, data, isTriggeredExternally }),
    );
    this.client.cache.emitter.onEmit((eventName, data, isTriggeredExternally) =>
      this.sendEvent({ eventSource: EventSourceType.CACHE, eventName, data, isTriggeredExternally }),
    );
    this.client.fetchDispatcher.emitter.onEmit((eventName, data, isTriggeredExternally) =>
      this.sendEvent({ eventSource: EventSourceType.FETCH_DISPATCHER, eventName, data, isTriggeredExternally }),
    );
    this.client.submitDispatcher.emitter.onEmit((eventName, data, isTriggeredExternally) =>
      this.sendEvent({ eventSource: EventSourceType.SUBMIT_DISPATCHER, eventName, data, isTriggeredExternally }),
    );
  };
}
