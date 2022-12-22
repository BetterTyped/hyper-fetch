import EventEmitter from "events";
import {
  stringifyQueryParams,
  StringifyCallbackType,
  QueryStringifyOptions,
  LoggerManager,
  SeverityType,
  AppManager,
  DateInterval,
  ClientQueryParamsType,
} from "@hyper-fetch/core";

import {
  SocketConfig,
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
import { WebsocketClientType, SocketClient } from "client";
import { Listener, ListenerOptionsType } from "listener";
import { Emitter, EmitterInstance, EmitterOptionsType } from "emitter";

export class Socket<ClientType extends Record<keyof WebsocketClientType, any>> {
  public emitter = new EventEmitter();
  public events = getSocketEvents(this.emitter);

  url: string;
  reconnect: number;
  reconnectTime: number;
  auth?: ClientQueryParamsType | string;
  queryParams?: ClientQueryParamsType | string;
  debug: boolean;
  autoConnect: boolean;

  // Callbacks
  __onOpenCallbacks: OpenCallbackType<Socket<ClientType>, any>[] = [];
  __onCloseCallbacks: CloseCallbackType<Socket<ClientType>, any>[] = [];
  __onReconnectCallbacks: ReconnectCallbackType<Socket<ClientType>>[] = [];
  __onReconnectStopCallbacks: ReconnectStopCallbackType<Socket<ClientType>>[] = [];
  __onMessageCallbacks: MessageCallbackType<Socket<ClientType>, any>[] = [];
  __onSendCallbacks: SendCallbackType<EmitterInstance>[] = [];
  __onErrorCallbacks: ErrorCallbackType<Socket<ClientType>, any>[] = [];

  // Config
  client: ClientType;
  loggerManager = new LoggerManager(this);
  appManager = new AppManager();
  queryParamsConfig?: QueryStringifyOptions;

  // Logger
  logger = this.loggerManager.init("Socket");

  /**
   * Method to stringify query params from objects.
   */
  queryParamsStringify: StringifyCallbackType = (queryParams) => {
    return stringifyQueryParams(queryParams, this.queryParamsConfig);
  };

  constructor(public options: SocketConfig<ClientType>) {
    const {
      url,
      auth,
      client,
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

    // Client must be initialized at the end
    this.client = client || (new SocketClient(this) as unknown as ClientType);
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
  setLogger = (callback: (socket: Socket<ClientType>) => LoggerManager) => {
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
  onOpen<Event = MessageEvent>(callback: OpenCallbackType<Socket<ClientType>, Event>) {
    this.__onOpenCallbacks.push(callback);
    return this;
  }
  /**
   * Triggered when connection is closed
   * @param callback
   * @returns
   */
  onClose<Event = MessageEvent>(callback: CloseCallbackType<Socket<ClientType>, Event>) {
    this.__onCloseCallbacks.push(callback);
    return this;
  }

  /**
   * Triggered when connection is getting reconnected
   * @param callback
   * @returns
   */
  onReconnect(callback: ReconnectCallbackType<Socket<ClientType>>) {
    this.__onReconnectCallbacks.push(callback);
    return this;
  }

  /**
   * Triggered when connection attempts are stopped
   * @param callback
   * @returns
   */
  onReconnectStop(callback: ReconnectStopCallbackType<Socket<ClientType>>) {
    this.__onReconnectStopCallbacks.push(callback);
    return this;
  }

  /**
   * Triggered when any message is received
   * @param callback
   * @returns
   */
  onMessage<Event = MessageEvent>(callback: MessageCallbackType<Socket<ClientType>, Event>) {
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
  onError<Event = MessageEvent>(callback: ErrorCallbackType<Socket<ClientType>, Event>) {
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
  createListener = <ResponseType>(options: ListenerOptionsType<ClientType>) => {
    return new Listener<ResponseType, ClientType>(this, options as any);
  };

  /**
   * Create event emitter
   * @param options
   * @returns
   */
  createEmitter = <RequestDataType, ResponseDataType = never>(options: EmitterOptionsType<ClientType>) => {
    if ("isSSE" in this.options) {
      throw new Error("Cannot create emitters for SSE client");
    }
    return new Emitter<RequestDataType, ResponseDataType, ClientType>(this, options as any);
  };
}
