import EventEmitter from "events";
import { LoggerManager, LogLevel, AppManager, Time } from "@hyper-fetch/core";

import {
  SocketOptionsType,
  ReconnectCallbackType,
  ReconnectFailedCallbackType,
  OpenCallbackType,
  CloseCallbackType,
  MessageCallbackType,
  SendCallbackType,
  ErrorCallbackType,
  getSocketEvents,
  interceptListener,
  interceptEmitter,
  SocketInstance,
} from "socket";
import { Listener, ListenerOptionsType } from "listener";
import { Emitter, EmitterInstance, EmitterOptionsType } from "emitter";
import { SocketAdapterInstance } from "adapter";
import { ExtractAdapterExtraType, ExtractAdapterQueryParamsType } from "types";
import { WebsocketAdapter, WebsocketAdapterType } from "adapter-websockets/websocket-adapter";

export class Socket<Adapter extends SocketAdapterInstance = WebsocketAdapterType> {
  public emitter = new EventEmitter();
  public events = getSocketEvents(this.emitter);

  url: string;
  reconnectAttempts: number;
  reconnectTime: number;
  debug: boolean;
  autoConnect: boolean;

  // Callbacks
  __onConnectedCallbacks: OpenCallbackType<SocketInstance>[] = [];
  __onDisconnectCallbacks: CloseCallbackType<SocketInstance>[] = [];
  __onReconnectCallbacks: ReconnectCallbackType<SocketInstance>[] = [];
  __onReconnectFailedCallbacks: ReconnectFailedCallbackType<SocketInstance>[] = [];
  __onMessageCallbacks: MessageCallbackType<SocketInstance, any>[] = [];
  __onSendCallbacks: SendCallbackType<EmitterInstance>[] = [];
  __onErrorCallbacks: ErrorCallbackType<SocketInstance, any>[] = [];

  // Config
  adapter: Adapter;
  loggerManager = new LoggerManager();
  appManager = new AppManager();

  // Logger
  logger = this.loggerManager.initialize(this, "Socket");

  constructor(public options: SocketOptionsType<Adapter>) {
    const { url, adapter, reconnect, reconnectTime, queryParams } = this.options;
    this.emitter?.setMaxListeners(1000);
    this.url = url;
    this.debug = false;
    this.reconnectAttempts = reconnect ?? Infinity;
    this.reconnectTime = reconnectTime ?? Time.SEC * 5;
    this.autoConnect = true;

    // Adapter must be initialized at the end
    const instanceOfAdapter = typeof adapter === "function" ? adapter() : adapter;
    this.adapter = instanceOfAdapter || (WebsocketAdapter() as unknown as Adapter);
    if (queryParams) {
      this.adapter.setQueryParams(queryParams);
    }
    this.adapter.initialize(this);
  }

  /**
   * This method connects the socket to the server
   */
  connect = async () => {
    await this.adapter.connect();
  };

  /**
   * This method disconnects the socket from the server
   */
  disconnect = async () => {
    await this.adapter.disconnect();
  };

  /**
   * This method reconnect the socket to the server
   */
  reconnect = async () => {
    await this.adapter.reconnect();
  };

  setQueryParams = (queryParams: ExtractAdapterQueryParamsType<Adapter>) => {
    this.adapter.setQueryParams(queryParams);
    return this;
  };

  /**
   * This method enables the logger usage and display the logs in console
   */
  setDebug = (enabled: boolean) => {
    this.debug = enabled;
    return this;
  };

  /**
   * Set the logger severity of the messages displayed to the console
   */
  setLogLevel = (level: LogLevel) => {
    this.loggerManager.setSeverity(level);
    return this;
  };

  /**
   * Set the new logger instance to the socket
   */
  setLogger = (callback: (socket: this) => LoggerManager) => {
    this.loggerManager = callback(this);
    return this;
  };

  /**
   * Callbacks
   */

  /**
   * Triggered when connection is opened
   * @param callback
   * @returns
   */
  onConnected(callback: OpenCallbackType<this>) {
    this.__onConnectedCallbacks.push(callback as any);
    return this;
  }
  /**
   * Triggered when connection is closed
   * @param callback
   * @returns
   */
  onDisconnected(callback: CloseCallbackType<this>) {
    this.__onDisconnectCallbacks.push(callback as any);
    return this;
  }

  /**
   * Triggered when connection is getting reconnected
   * @param callback
   * @returns
   */
  onReconnect(callback: ReconnectCallbackType<this>) {
    this.__onReconnectCallbacks.push(callback as any);
    return this;
  }

  /**
   * Triggered when connection attempts are stopped
   * @param callback
   * @returns
   */
  onReconnectFailed(callback: ReconnectFailedCallbackType<this>) {
    this.__onReconnectFailedCallbacks.push(callback as any);
    return this;
  }

  /**
   * Triggered when any message is received
   * @param callback
   * @returns
   */
  onMessage<Event = ExtractAdapterExtraType<Adapter>>(callback: MessageCallbackType<this, Event>) {
    this.__onMessageCallbacks.push(callback as any);
    return this;
  }

  /**
   * Triggered when any event is emitted
   * @param callback
   * @returns
   */
  onSend(callback: SendCallbackType<EmitterInstance>) {
    this.__onSendCallbacks.push(callback);
    return this;
  }

  /**
   * Triggered when we receive error
   * @param callback
   * @returns
   */
  onError<Event = ExtractAdapterExtraType<Adapter>>(callback: ErrorCallbackType<this, Event>) {
    this.__onErrorCallbacks.push(callback as any);
    return this;
  }

  /**
   * ********************
   * Interceptors
   * ********************
   */

  __modifySend = (emitter: EmitterInstance) => {
    return interceptEmitter(this.__onSendCallbacks, emitter);
  };

  __modifyResponse = (data: { data: any; extra: ExtractAdapterExtraType<Adapter> }) => {
    return interceptListener(this.__onMessageCallbacks, data, this);
  };

  /**
   * ********************
   * Creators
   * ********************
   */

  /**
   * Create event listener
   * @param options
   * @returns
   */
  createListener = <Response>() => {
    return <Endpoint extends string>(options: ListenerOptionsType<Endpoint, Adapter>) => {
      return new Listener<Response, Endpoint, Adapter>(this, options);
    };
  };

  /**
   * Create event emitter
   * @param options
   * @returns
   */
  createEmitter = <Payload>() => {
    return <Endpoint extends string>(options: EmitterOptionsType<Endpoint, Adapter>) => {
      return new Emitter<Payload, Endpoint, Adapter>(this, options);
    };
  };
}
