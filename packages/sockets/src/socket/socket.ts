import EventEmitter from "events";
import {
  stringifyQueryParams,
  StringifyCallbackType,
  ClientPayloadMappingCallback,
  getClientPayload,
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
  SocketClientType,
  getSocketEvents,
} from "socket";
import { WebsocketClientType, WebSocketClient, SseClient } from "client";
import { Listener, ListenerOptionsType } from "listener";
import { Emitter, EmitterOptionsType } from "emitter";

export class Socket<ClientType extends Record<keyof WebsocketClientType | string, any> = WebsocketClientType> {
  public emitter = new EventEmitter();
  public events: ReturnType<typeof getSocketEvents> = getSocketEvents(this.emitter);

  url: string;
  protocols: string[] = [];
  reconnect: number;
  reconnectTime: number;
  auth?: ClientQueryParamsType | string;
  queryParams?: ClientQueryParamsType | string;
  debug: boolean;
  isSSE: boolean;
  autoConnect: boolean;

  // Callbacks
  __onOpenCallbacks: OpenCallbackType<ClientType>[] = [];
  __onCloseCallbacks: CloseCallbackType<ClientType>[] = [];
  __onReconnectCallbacks: ReconnectCallbackType<ClientType>[] = [];
  __onReconnectStopCallbacks: ReconnectStopCallbackType<ClientType>[] = [];
  __onMessageCallbacks: MessageCallbackType<ClientType>[] = [];
  __onSendCallbacks: SendCallbackType<ClientType>[] = [];
  __onErrorCallbacks: ErrorCallbackType<ClientType>[] = [];

  // Config
  client: SocketClientType<ClientType>;
  loggerManager = new LoggerManager(this);
  appManager = new AppManager();
  queryParamsConfig?: QueryStringifyOptions;

  // Logger
  logger = this.loggerManager.init("Socket");

  /**
   * Method to get request data and transform them to the required format. It handles FormData and JSON by default.
   */
  payloadMapper: ClientPayloadMappingCallback = getClientPayload;

  /**
   * Method to stringify query params from objects.
   */
  queryParamsStringify: StringifyCallbackType = (queryParams) => {
    return stringifyQueryParams(queryParams, this.queryParamsConfig);
  };

  constructor(public options: SocketConfig<ClientType>) {
    const {
      url,
      isSSE,
      debug,
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
    this.debug = debug ?? false;
    this.isSSE = isSSE ?? false;
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
    this.client = client || ((this.isSSE ? new SseClient(this) : new WebSocketClient(this)) as any);
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
   * Set the request payload mapping function which get triggered before request get send
   */
  setPayloadMapper = (payloadMapper: ClientPayloadMappingCallback): Socket<ClientType> => {
    this.payloadMapper = payloadMapper;
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
  onOpen = (callback: OpenCallbackType<ClientType>) => {
    this.__onOpenCallbacks.push(callback);
    return this;
  };
  /**
   * Triggered when connection is closed
   * @param callback
   * @returns
   */
  onClose = (callback: CloseCallbackType<ClientType>) => {
    this.__onCloseCallbacks.push(callback);
    return this;
  };

  /**
   * Triggered when connection is getting reconnected
   * @param callback
   * @returns
   */
  onReconnect = (callback: ReconnectCallbackType<ClientType>) => {
    this.__onReconnectCallbacks.push(callback);
    return this;
  };

  /**
   * Triggered when connection attempts are stopped
   * @param callback
   * @returns
   */
  onReconnectStop = (callback: ReconnectStopCallbackType<ClientType>) => {
    this.__onReconnectStopCallbacks.push(callback);
    return this;
  };

  /**
   * Triggered when any message is received
   * @param callback
   * @returns
   */
  onMessage = (callback: MessageCallbackType<ClientType>) => {
    this.__onMessageCallbacks.push(callback);
    return this;
  };

  /**
   * Triggered when any event is emitted
   * @param callback
   * @returns
   */
  onSend = (callback: SendCallbackType<ClientType>) => {
    this.__onSendCallbacks.push(callback);
    return this;
  };

  /**
   * Triggered when we receive error
   * @param callback
   * @returns
   */
  onError = (callback: ErrorCallbackType<ClientType>) => {
    this.__onErrorCallbacks.push(callback);
    return this;
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
  createEmitter = <RequestDataType>(options: EmitterOptionsType<ClientType>) => {
    return new Emitter<RequestDataType, ClientType>(this, options as any);
  };
}
