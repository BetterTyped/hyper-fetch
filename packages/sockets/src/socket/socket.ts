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
} from "socket";
import { ListenerInstance, ListenerOptionsType } from "listener";
import { EmitterInstance, EmitterOptionsType } from "emitter";
import { WebsocketClientType, WebSocketClient } from "client";

export class Socket<
  GlobalErrorType,
  AdditionalListenerOptions,
  AdditionalEmitterOptions,
  WebsocketType = void,
  QueryParamsType extends ClientQueryParamsType | string = ClientQueryParamsType | string,
> {
  readonly url: string;
  readonly protocols: string[] = [];
  readonly reconnect: number;
  readonly reconnectTime: number;
  debug: boolean;
  auth?: ClientQueryParamsType;
  queryParams?: QueryParamsType;

  // Callbacks
  __onOpenCallbacks: OpenCallbackType<WebsocketClientType<WebsocketType>>[] = [];
  __onCloseCallbacks: CloseCallbackType<WebsocketClientType<WebsocketType>>[] = [];
  __onReconnectCallbacks: ReconnectCallbackType<WebsocketClientType<WebsocketType>>[] = [];
  __onReconnectStopCallbacks: ReconnectStopCallbackType<WebsocketClientType<WebsocketType>>[] = [];
  __onMessageCallbacks: MessageCallbackType<WebsocketClientType<WebsocketType>>[] = [];
  __onSendCallbacks: SendCallbackType<WebsocketClientType<WebsocketType>>[] = [];
  __onErrorCallbacks: ErrorCallbackType<WebsocketClientType<WebsocketType>>[] = [];

  // Config
  client: WebsocketClientType<WebsocketType>;
  loggerManager = new LoggerManager(this);
  appManager = new AppManager();
  queryParamsConfig?: QueryStringifyOptions;

  // Logger
  logger = this.loggerManager.init("Socket");

  listenerConfig?: (
    listenerOptions: ListenerOptionsType<AdditionalListenerOptions>,
  ) => Partial<ListenerOptionsType<AdditionalListenerOptions>>;
  emitterConfig?: (
    emitterOptions: EmitterOptionsType<AdditionalEmitterOptions>,
  ) => Partial<EmitterOptionsType<AdditionalEmitterOptions>>;

  constructor(public options: SocketConfig<WebsocketType, QueryParamsType>) {
    const { url, auth, queryParams, client, reconnect, reconnectTime, queryParamsConfig, queryParamsStringify } =
      this.options;
    this.url = url;
    this.auth = auth;
    this.queryParams = queryParams;
    this.reconnect = reconnect ?? Infinity;
    this.reconnectTime = reconnectTime ?? DateInterval.second * 2;
    this.queryParamsConfig = queryParamsConfig;
    this.queryParamsStringify = queryParamsStringify;

    // Client must be initialized at the end
    this.client = client || (new WebSocketClient(this) as unknown as WebsocketClientType<WebsocketType>);
  }

  /**
   * Method to get request data and transform them to the required format. It handles FormData and JSON by default.
   */
  payloadMapper: ClientPayloadMappingCallback = getClientPayload;

  /**
   * This method allows to configure global defaults for the listener configuration
   */
  setListenerConfig = (
    callback: (listener: ListenerInstance) => Partial<ListenerOptionsType<AdditionalListenerOptions>>,
  ): Socket<GlobalErrorType, AdditionalListenerOptions, AdditionalEmitterOptions, WebsocketType, QueryParamsType> => {
    this.listenerConfig = callback;
    return this;
  };

  /**
   * This method allows to configure global defaults for the listener configuration
   */
  setEmitterConfig = (
    callback: (listener: EmitterInstance) => Partial<EmitterOptionsType<AdditionalEmitterOptions>>,
  ): Socket<GlobalErrorType, AdditionalListenerOptions, AdditionalEmitterOptions, WebsocketType, QueryParamsType> => {
    this.emitterConfig = callback;
    return this;
  };

  /**
   * Method to stringify query params from objects.
   */
  queryParamsStringify: StringifyCallbackType = (queryParams) => {
    return stringifyQueryParams(queryParams, this.queryParamsConfig);
  };

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
  setLogger = (
    callback: (
      socket: Socket<
        GlobalErrorType,
        AdditionalListenerOptions,
        AdditionalEmitterOptions,
        WebsocketType,
        QueryParamsType
      >,
    ) => LoggerManager,
  ) => {
    this.loggerManager = callback(this);
    return this;
  };

  /**
   * Set the request payload mapping function which get triggered before request get send
   */
  setPayloadMapper = (
    payloadMapper: ClientPayloadMappingCallback,
  ): Socket<GlobalErrorType, AdditionalListenerOptions, AdditionalEmitterOptions, WebsocketType, QueryParamsType> => {
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
  onOpen = (callback: OpenCallbackType<WebsocketClientType<WebsocketType>>) => {
    this.__onOpenCallbacks.push(callback);
    return this;
  };
  /**
   * Triggered when connection is closed
   * @param callback
   * @returns
   */
  onClose = (callback: CloseCallbackType<WebsocketClientType<WebsocketType>>) => {
    this.__onCloseCallbacks.push(callback);
    return this;
  };

  /**
   * Triggered when connection is getting reconnected
   * @param callback
   * @returns
   */
  onReconnect = (callback: ReconnectCallbackType<WebsocketClientType<WebsocketType>>) => {
    this.__onReconnectCallbacks.push(callback);
    return this;
  };

  /**
   * Triggered when connection attempts are stopped
   * @param callback
   * @returns
   */
  onReconnectStop = (callback: ReconnectStopCallbackType<WebsocketClientType<WebsocketType>>) => {
    this.__onReconnectStopCallbacks.push(callback);
    return this;
  };

  /**
   * Triggered when any message is received
   * @param callback
   * @returns
   */
  onMessage = (callback: MessageCallbackType<WebsocketClientType<WebsocketType>>) => {
    this.__onMessageCallbacks.push(callback);
    return this;
  };

  /**
   * Triggered when any event is emitted
   * @param callback
   * @returns
   */
  onSend = (callback: SendCallbackType<WebsocketClientType<WebsocketType>>) => {
    this.__onSendCallbacks.push(callback);
    return this;
  };

  /**
   * Triggered when we receive error
   * @param callback
   * @returns
   */
  onError = (callback: ErrorCallbackType<WebsocketClientType<WebsocketType>>) => {
    this.__onErrorCallbacks.push(callback);
    return this;
  };
}
