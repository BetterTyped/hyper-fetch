import {
  stringifyQueryParams,
  StringifyCallbackType,
  ClientHeaderMappingCallback,
  getClientHeaders,
  ClientPayloadMappingCallback,
  getClientPayload,
  QueryStringifyOptions,
  LoggerManager,
  SeverityType,
  AppManager,
} from "@hyper-fetch/core";

import { SocketConfig } from "socket";
import { ClientType } from "client";
import { ListenerInstance, ListenerOptionsType } from "listener";
import { EmitterInstance, EmitterOptionsType } from "emitter";

export class Socket<GlobalErrorType, AdditionalListenerOptions, AdditionalEmitterOptions, ClientSocketType> {
  readonly url: string; /// ????
  readonly protocols: string[]; /// ????
  readonly reconnect: number;
  readonly reconnectTime: number;
  debug: boolean;

  // TODO!!!!!
  // onOpen
  // onClose
  // onReconnection
  // onReconnectionStop
  // onAuth
  // onError

  // Config
  client: ClientType<ClientSocketType>;
  loggerManager = new LoggerManager(this);
  appManager = new AppManager();
  headers: HeadersInit;

  // Options
  queryParamsConfig?: QueryStringifyOptions;

  listenerConfig?: (
    listenerOptions: ListenerOptionsType<AdditionalListenerOptions>,
  ) => Partial<ListenerOptionsType<AdditionalListenerOptions>>;
  emitterConfig?: (
    emitterOptions: EmitterOptionsType<AdditionalEmitterOptions>,
  ) => Partial<EmitterOptionsType<AdditionalEmitterOptions>>;

  /**
   * This method allows to configure global defaults for the listener configuration
   */
  setListenerConfig = (
    callback: (listener: ListenerInstance) => Partial<ListenerOptionsType<AdditionalListenerOptions>>,
  ): Socket<GlobalErrorType, AdditionalListenerOptions, AdditionalEmitterOptions, ClientSocketType> => {
    this.listenerConfig = callback;
    return this;
  };

  /**
   * This method allows to configure global defaults for the listener configuration
   */
  setEmitterConfig = (
    callback: (listener: EmitterInstance) => Partial<EmitterOptionsType<AdditionalEmitterOptions>>,
  ): Socket<GlobalErrorType, AdditionalListenerOptions, AdditionalEmitterOptions, ClientSocketType> => {
    this.emitterConfig = callback;
    return this;
  };

  // Utils

  /**
   * Method to stringify query params from objects.
   */
  stringifyQueryParams: StringifyCallbackType = (queryParams) =>
    stringifyQueryParams(queryParams, this.queryParamsConfig);
  /**
   * Method to get default headers and to map them based on the data format exchange, by default it handles FormData / JSON formats.
   */
  headerMapper: ClientHeaderMappingCallback = getClientHeaders;
  /**
   * Method to get request data and transform them to the required format. It handles FormData and JSON by default.
   */
  payloadMapper: ClientPayloadMappingCallback = getClientPayload;

  // Logger
  logger = this.loggerManager.init("Socket");

  constructor(public options: SocketConfig) {
    const { url, client, reconnect, reconnectTime } = this.options;
    this.url = url;
    // TODO add default
    this.client = client as any;
    this.reconnect = reconnect ?? 10;
    this.reconnectTime = reconnectTime ?? 2000;
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
  setLogger = (
    callback: (
      socket: Socket<GlobalErrorType, AdditionalListenerOptions, AdditionalEmitterOptions, ClientSocketType>,
    ) => LoggerManager,
  ) => {
    this.loggerManager = callback(this);
    return this;
  };

  /**
   * Set config for the query params stringify method, we can set here, among others, arrayFormat, skipNull, encode, skipEmptyString and more
   */
  setQueryParamsConfig = (queryParamsConfig: QueryStringifyOptions) => {
    this.queryParamsConfig = queryParamsConfig;
    return this;
  };

  /**
   * Set the custom query params stringify method to the socket
   * @param stringifyFn Custom callback handling query params stringify
   */
  setStringifyQueryParams = (stringifyFn: StringifyCallbackType) => {
    this.stringifyQueryParams = stringifyFn;
    return this;
  };

  /**
   * Set the custom header mapping function
   */
  setHeaderMapper = (headerMapper: ClientHeaderMappingCallback) => {
    this.headerMapper = headerMapper;
    return this;
  };

  /**
   * Set custom http client to handle graphql, rest, firebase or other
   */
  setClient = <T>(
    callback: (
      socket: Socket<GlobalErrorType, AdditionalListenerOptions, AdditionalEmitterOptions, T>,
    ) => ClientType<T>,
  ) => {
    this.client = callback(this as any) as any;
    return this as unknown as Socket<GlobalErrorType, AdditionalListenerOptions, AdditionalEmitterOptions, T>;
  };

  /**
   * Set custom headers
   */
  setHeaders(headers: HeadersInit) {
    this.headers = headers;
  }
}
