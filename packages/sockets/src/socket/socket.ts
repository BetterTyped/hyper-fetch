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
import { SocketAdapterInstance, WebsocketAdapterType, WebsocketAdapter } from "adapter";
import { ExtractAdapterExtraType } from "types";

export class Socket<Adapter extends SocketAdapterInstance = WebsocketAdapterType> {
  public emitter = new EventEmitter();
  public events = getSocketEvents(this.emitter);

  url: string;
  reconnectAttempts: number;
  reconnectTime: number;
  queryParams?: QueryParamsType | string;
  debug: boolean;

  // Callbacks
  __onConnectedCallbacks: OpenCallbackType<this>[] = [];
  __onDisconnectCallbacks: CloseCallbackType<this>[] = [];
  __onReconnectCallbacks: ReconnectCallbackType<this>[] = [];
  __onReconnectStopCallbacks: ReconnectStopCallbackType<this>[] = [];
  __onMessageCallbacks: MessageCallbackType<this, any>[] = [];
  __onSendCallbacks: SendCallbackType<EmitterInstance>[] = [];
  __onErrorCallbacks: ErrorCallbackType<this, any>[] = [];

  // Config
  adapter: ReturnType<Adapter>;
  loggerManager = new LoggerManager(this);
  appManager = new AppManager();
  queryParamsConfig?: QueryStringifyOptionsType;

  // Logger
  logger = this.loggerManager.init("Socket");

  constructor(public options: SocketOptionsType<Adapter>) {
    const { url, adapter, queryParams, reconnect, reconnectTime, queryParamsConfig, queryParamsStringify } =
      this.options;
    this.emitter?.setMaxListeners(Infinity);
    this.url = url;
    this.queryParams = queryParams;
    this.debug = false;
    this.reconnectAttempts = reconnect ?? Infinity;
    this.reconnectTime = reconnectTime ?? Time.SEC * 2;

    if (queryParamsConfig) {
      this.queryParamsConfig = queryParamsConfig;
    }
    if (queryParamsStringify) {
      this.queryParamsStringify = queryParamsStringify;
    }

    // Adapter must be initialized at the end
    this.adapter = (adapter ? adapter(this) : WebsocketAdapter(this)) as unknown as ReturnType<Adapter>;
  }

  /**
   * This method connects the socket to the server
   */
  connect = () => {
    this.adapter.connect();
    return this.waitForConnection();
  };

  /**
   * This method disconnects the socket from the server
   */
  disconnect = () => {
    this.adapter.disconnect();
  };

  /**
   * This method reconnect the socket to the server
   */
  reconnect = () => {
    this.adapter.reconnect();
  };

  waitForConnection = (timeout = Time.SEC * 4): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      if (this.adapter.state.connected) {
        resolve(true);
        return;
      }

      let id: NodeJS.Timeout;
      const unmount = this.events.onConnected(() => {
        unmount();
        resolve(true);
        clearTimeout(id);
      });

      id = setTimeout(() => {
        unmount();
        throw new Error("Connection timeout");
      }, timeout);
    });
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
  setLogger = (callback: (socket: this) => LoggerManager) => {
    this.loggerManager = callback(this);
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
  onConnected(callback: OpenCallbackType<this>) {
    this.__onConnectedCallbacks.push(callback);
    return this;
  }
  /**
   * Triggered when connection is closed
   * @param callback
   * @returns
   */
  onDisconnected(callback: CloseCallbackType<this>) {
    this.__onDisconnectCallbacks.push(callback);
    return this;
  }

  /**
   * Triggered when connection is getting reconnected
   * @param callback
   * @returns
   */
  onReconnect(callback: ReconnectCallbackType<this>) {
    this.__onReconnectCallbacks.push(callback);
    return this;
  }

  /**
   * Triggered when connection attempts are stopped
   * @param callback
   * @returns
   */
  onReconnectStop(callback: ReconnectStopCallbackType<this>) {
    this.__onReconnectStopCallbacks.push(callback);
    return this;
  }

  /**
   * Triggered when any message is received
   * @param callback
   * @returns
   */
  onMessage<Event = ExtractAdapterExtraType<Adapter>>(callback: MessageCallbackType<this, Event>) {
    this.__onMessageCallbacks.push(callback);
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
    this.__onErrorCallbacks.push(callback);
    return this;
  }

  /**
   * Method to stringify query params from objects.
   */
  queryParamsStringify: StringifyCallbackType = (queryParams) => {
    return stringifyQueryParams(queryParams, this.queryParamsConfig);
  };

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
      return new Emitter<Payload, Endpoint, Socket<Adapter>>(this, options);
    };
  };
}
