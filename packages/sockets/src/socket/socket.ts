import EventEmitter from "events";
import {
  stringifyQueryParams,
  StringifyCallbackType,
  QueryStringifyOptionsType,
  LoggerManager,
  SeverityType,
  AppManager,
  DateInterval,
  QueryParamsType,
} from "@hyper-fetch/core";

import {
  SocketAdapterOptionsType,
  ReconnectCallbackType,
  ReconnectStopCallbackType,
  OpenCallbackType,
  CloseCallbackType,
  MessageCallbackType,
  SendCallbackType,
  ErrorCallbackType,
  getSocketEvents,
  interceptListener,
  interceptEmitter,
} from "socket";
import { AdapterType, SocketAdapter } from "adapter";
import { Listener, ListenerOptionsType } from "listener";
import { Emitter, EmitterInstance, EmitterOptionsType } from "emitter";

export class Socket<Adapter extends Record<keyof AdapterType, any>> {
  public emitter = new EventEmitter();
  public events = getSocketEvents(this.emitter);

  url: string;
  reconnect: number;
  reconnectTime: number;
  auth?: QueryParamsType | string;
  queryParams?: QueryParamsType | string;
  debug: boolean;
  autoConnect: boolean;

  // Callbacks
  __onOpenCallbacks: OpenCallbackType<Socket<Adapter>, any>[] = [];
  __onCloseCallbacks: CloseCallbackType<Socket<Adapter>, any>[] = [];
  __onReconnectCallbacks: ReconnectCallbackType<Socket<Adapter>>[] = [];
  __onReconnectStopCallbacks: ReconnectStopCallbackType<Socket<Adapter>>[] = [];
  __onMessageCallbacks: MessageCallbackType<Socket<Adapter>, any>[] = [];
  __onSendCallbacks: SendCallbackType<EmitterInstance>[] = [];
  __onErrorCallbacks: ErrorCallbackType<Socket<Adapter>, any>[] = [];

  // Config
  adapter: Adapter;
  loggerManager = new LoggerManager(this);
  appManager = new AppManager();
  queryParamsConfig?: QueryStringifyOptionsType;

  // Logger
  logger = this.loggerManager.init("Socket");

  /**
   * Method to stringify query params from objects.
   */
  queryParamsStringify: StringifyCallbackType = (queryParams) => {
    return stringifyQueryParams(queryParams, this.queryParamsConfig);
  };

  constructor(public options: SocketAdapterOptionsType<Adapter>) {
    const {
      url,
      auth,
      adapter,
      queryParams,
      autoConnect,
      reconnect,
      reconnectTime,
      queryParamsConfig,
      queryParamsStringify,
    } = this.options;
    this.url = url;
    this.auth = auth;
    this.queryParams = queryParams;
    this.debug = false;
    this.autoConnect = autoConnect ?? true;
    this.reconnect = reconnect ?? Infinity;
    this.reconnectTime = reconnectTime ?? DateInterval.second * 2;

    if (queryParamsConfig) {
      this.queryParamsConfig = queryParamsConfig;
    }
    if (queryParamsStringify) {
      this.queryParamsStringify = queryParamsStringify;
    }

    // Adapter must be initialized at the end
    this.adapter = adapter || (new SocketAdapter(this) as unknown as Adapter);
  }

  /**
   * This method enables the logger usage and display the logs in console
   */
  setDebug = (debug: boolean) => {
    this.debug = debug;
    return this;
  };

  /**
   * Set the logger severity of the messages displayed to the console
   */
  setLoggerSeverity = (severity: SeverityType) => {
    this.loggerManager.setSeverity(severity);
    return this;
  };

  /**
   * Set the new logger instance to the socket
   */
  setLogger = (callback: (socket: Socket<Adapter>) => LoggerManager) => {
    this.loggerManager = callback(this);
    return this;
  };

  /**
   * Set the new auth data to the socket
   */
  setAuth = (auth: QueryParamsType | string) => {
    this.auth = auth;
    this.adapter.reconnect();
    return this;
  };

  /**
   * Set the new query data to the socket
   */
  setQuery = (queryParams: QueryParamsType | string) => {
    this.queryParams = queryParams;
    this.adapter.reconnect();
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
  onOpen<Event = MessageEvent>(callback: OpenCallbackType<Socket<Adapter>, Event>) {
    this.__onOpenCallbacks.push(callback);
    return this;
  }
  /**
   * Triggered when connection is closed
   * @param callback
   * @returns
   */
  onClose<Event = MessageEvent>(callback: CloseCallbackType<Socket<Adapter>, Event>) {
    this.__onCloseCallbacks.push(callback);
    return this;
  }

  /**
   * Triggered when connection is getting reconnected
   * @param callback
   * @returns
   */
  onReconnect(callback: ReconnectCallbackType<Socket<Adapter>>) {
    this.__onReconnectCallbacks.push(callback);
    return this;
  }

  /**
   * Triggered when connection attempts are stopped
   * @param callback
   * @returns
   */
  onReconnectStop(callback: ReconnectStopCallbackType<Socket<Adapter>>) {
    this.__onReconnectStopCallbacks.push(callback);
    return this;
  }

  /**
   * Triggered when any message is received
   * @param callback
   * @returns
   */
  onMessage<Event = MessageEvent>(callback: MessageCallbackType<Socket<Adapter>, Event>) {
    this.__onMessageCallbacks.push(callback);
    return this;
  }

  /**
   * Triggered when any event is emitted
   * @param callback
   * @returns
   */
  onSend<EmitterType extends EmitterInstance>(callback: SendCallbackType<EmitterType>) {
    this.__onSendCallbacks.push(callback);
    return this;
  }

  /**
   * Triggered when we receive error
   * @param callback
   * @returns
   */
  onError<Event = MessageEvent>(callback: ErrorCallbackType<Socket<Adapter>, Event>) {
    this.__onErrorCallbacks.push(callback);
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

  __modifyResponse = (response: MessageEvent) => {
    return interceptListener(this.__onMessageCallbacks, response, this);
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
  createListener = <Response>(options: ListenerOptionsType<Adapter>) => {
    return new Listener<Response, Adapter>(this, options as any);
  };

  /**
   * Create event emitter
   * @param options
   * @returns
   */
  createEmitter = <Payload, Response = never>(options: EmitterOptionsType<Adapter>) => {
    if ("isSSE" in this.options) {
      throw new Error("Cannot create emitters for SSE adapter");
    }
    return new Emitter<Payload, Response, Adapter>(this, options as any);
  };
}
