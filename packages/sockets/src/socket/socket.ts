import EventEmitter from "events";
import {
  stringifyQueryParams,
  StringifyCallbackType,
  QueryStringifyOptionsType,
  LoggerManager,
  SeverityType,
  AppManager,
  Time,
  QueryParamsType,
  TypeWithDefaults,
} from "@hyper-fetch/core";

import {
  SocketOptionsType,
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
import { Listener, ListenerOptionsType } from "listener";
import { Emitter, EmitterInstance, EmitterOptionsType } from "emitter";
import { SocketAdapterInstance, WebsocketAdapterType, websocketAdapter } from "adapter";
import { ExtractSocketExtraType } from "types";

export class Socket<AdapterType extends SocketAdapterInstance = WebsocketAdapterType> {
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
  __onOpenCallbacks: OpenCallbackType<Socket<AdapterType>>[] = [];
  __onCloseCallbacks: CloseCallbackType<Socket<AdapterType>>[] = [];
  __onReconnectCallbacks: ReconnectCallbackType<Socket<AdapterType>>[] = [];
  __onReconnectStopCallbacks: ReconnectStopCallbackType<Socket<AdapterType>>[] = [];
  __onMessageCallbacks: MessageCallbackType<Socket<AdapterType>, any>[] = [];
  __onSendCallbacks: SendCallbackType<EmitterInstance>[] = [];
  __onErrorCallbacks: ErrorCallbackType<Socket<AdapterType>, any>[] = [];

  // Config
  adapter: ReturnType<AdapterType>;
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

  constructor(public options: SocketOptionsType<AdapterType>) {
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
    this.emitter?.setMaxListeners(Infinity);
    this.url = url;
    this.auth = auth;
    this.queryParams = queryParams;
    this.debug = false;
    this.autoConnect = autoConnect ?? true;
    this.reconnect = reconnect ?? Infinity;
    this.reconnectTime = reconnectTime ?? Time.SEC * 2;

    if (queryParamsConfig) {
      this.queryParamsConfig = queryParamsConfig;
    }
    if (queryParamsStringify) {
      this.queryParamsStringify = queryParamsStringify;
    }

    // Adapter must be initialized at the end
    this.adapter = (adapter
      ? adapter(this as unknown as Socket<SocketAdapterInstance>)
      : websocketAdapter(this as unknown as Socket<SocketAdapterInstance>)) as unknown as ReturnType<AdapterType>;
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
  setLogger = (callback: (socket: Socket<AdapterType>) => LoggerManager) => {
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
  onOpen(callback: OpenCallbackType<Socket<AdapterType>>) {
    this.__onOpenCallbacks.push(callback);
    return this;
  }
  /**
   * Triggered when connection is closed
   * @param callback
   * @returns
   */
  onClose(callback: CloseCallbackType<Socket<AdapterType>>) {
    this.__onCloseCallbacks.push(callback);
    return this;
  }

  /**
   * Triggered when connection is getting reconnected
   * @param callback
   * @returns
   */
  onReconnect(callback: ReconnectCallbackType<Socket<AdapterType>>) {
    this.__onReconnectCallbacks.push(callback);
    return this;
  }

  /**
   * Triggered when connection attempts are stopped
   * @param callback
   * @returns
   */
  onReconnectStop(callback: ReconnectStopCallbackType<Socket<AdapterType>>) {
    this.__onReconnectStopCallbacks.push(callback);
    return this;
  }

  /**
   * Triggered when any message is received
   * @param callback
   * @returns
   */
  onMessage<Event = ExtractSocketExtraType<AdapterType>>(callback: MessageCallbackType<Socket<AdapterType>, Event>) {
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
  onError<Event = ExtractSocketExtraType<AdapterType>>(callback: ErrorCallbackType<Socket<AdapterType>, Event>) {
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

  __modifyResponse = (data: { data: any; extra: ExtractSocketExtraType<AdapterType> }) => {
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
  createListener = <Properties extends { response?: any } = { response: undefined }>() => {
    return <Endpoint extends string>(options: ListenerOptionsType<Endpoint, AdapterType>) => {
      return new Listener<{
        response: TypeWithDefaults<Properties, "response", undefined>;
        endpoint: Endpoint;
        adapter: AdapterType;
      }>(this, options);
    };
  };

  /**
   * Create event emitter
   * @param options
   * @returns
   */
  createEmitter = <
    Properties extends { payload?: any; response?: any } = {
      payload: undefined;
      response: undefined;
    },
  >() => {
    return <Endpoint extends string>(options: EmitterOptionsType<Endpoint, AdapterType>) => {
      return new Emitter<{
        payload: TypeWithDefaults<Properties, "payload", undefined>;
        response: TypeWithDefaults<Properties, "response", undefined>;
        endpoint: Endpoint;
        adapter: AdapterType;
        mappedData: void;
      }>(this, options);
    };
  };
}
