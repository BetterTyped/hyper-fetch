import type { LogLevel } from "@hyper-fetch/core";
import { LoggerManager, AppManager, Time } from "@hyper-fetch/core";
import type { SocketAdapterInstance } from "adapter";
import type { WebsocketAdapterType } from "adapter-websockets/websocket-adapter";
import { WebsocketAdapter } from "adapter-websockets/websocket-adapter";
import type { EmitterInstance, EmitterOptionsType } from "emitter";
import { Emitter } from "emitter";
import EventEmitter from "events";
import type { ListenerOptionsType } from "listener";
import { Listener } from "listener";
import type {
  SocketOptionsType,
  ConnectCallbackType,
  SocketConnectionType,
  ReconnectCallbackType,
  ReconnectFailedCallbackType,
  OpenCallbackType,
  CloseCallbackType,
  MessageCallbackType,
  SendCallbackType,
  ErrorCallbackType,
} from "socket";
import { getSocketEvents, interceptListener, interceptEmitter, interceptConnection } from "socket";
import type { ExtractAdapterExtraType, ExtractAdapterQueryParamsType } from "types";

export class Socket<Adapter extends SocketAdapterInstance = WebsocketAdapterType> {
  public emitter = new EventEmitter();
  public events = getSocketEvents(this.emitter);

  url: string;
  reconnectAttempts: number;
  reconnectTime: number;
  debug: boolean;
  autoConnect: boolean;

  // Callbacks
  unstable_onConnectCallbacks: ConnectCallbackType<Adapter>[] = [];
  unstable_onConnectedCallbacks: OpenCallbackType[] = [];
  unstable_onDisconnectCallbacks: CloseCallbackType[] = [];
  unstable_onReconnectCallbacks: ReconnectCallbackType[] = [];
  unstable_onReconnectFailedCallbacks: ReconnectFailedCallbackType[] = [];
  unstable_onMessageCallbacks: MessageCallbackType<any>[] = [];
  unstable_onSendCallbacks: SendCallbackType<EmitterInstance>[] = [];
  unstable_onErrorCallbacks: ErrorCallbackType<any>[] = [];

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

  /**
   * Set the default query params used by the next connection attempts.
   * Call `reconnect()` to apply them to a live connection, or use `onConnect` to resolve them per attempt.
   */
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
  setLogger = (callback: (socket: Socket<Adapter>) => LoggerManager) => {
    this.loggerManager = callback(this);
    return this;
  };

  /**
   * Callbacks
   */

  /**
   * Triggered before every connection attempt (initial, automatic and manual reconnect).
   * Receives the connection details (`url`, `queryParams`, `adapterOptions`) and must return them, optionally
   * modified. Use it to resolve values that change over time - like auth tokens - right when they are needed.
   * @param callback
   * @returns
   */
  onConnect(callback: ConnectCallbackType<Adapter>) {
    this.unstable_onConnectCallbacks.push(callback);
    return this;
  }

  /**
   * Triggered when connection is opened
   * @param callback
   * @returns
   */
  onConnected(callback: OpenCallbackType) {
    this.unstable_onConnectedCallbacks.push(callback);
    return this;
  }
  /**
   * Triggered when connection is closed
   * @param callback
   * @returns
   */
  onDisconnected(callback: CloseCallbackType) {
    this.unstable_onDisconnectCallbacks.push(callback);
    return this;
  }

  /**
   * Triggered when connection is getting reconnected
   * @param callback
   * @returns
   */
  onReconnect(callback: ReconnectCallbackType) {
    this.unstable_onReconnectCallbacks.push(callback);
    return this;
  }

  /**
   * Triggered when connection attempts are stopped
   * @param callback
   * @returns
   */
  onReconnectFailed(callback: ReconnectFailedCallbackType) {
    this.unstable_onReconnectFailedCallbacks.push(callback);
    return this;
  }

  /**
   * Triggered when any message is received
   * @param callback
   * @returns
   */
  onMessage<Event>(callback: MessageCallbackType<Event>) {
    this.unstable_onMessageCallbacks.push(callback);
    return this;
  }

  /**
   * Triggered when any event is emitted
   * @param callback
   * @returns
   */
  onSend(callback: SendCallbackType<EmitterInstance>) {
    this.unstable_onSendCallbacks.push(callback);
    return this;
  }

  /**
   * Triggered when we receive error
   * @param callback
   * @returns
   */
  onError<Event>(callback: ErrorCallbackType<Event>) {
    this.unstable_onErrorCallbacks.push(callback);
    return this;
  }

  /**
   * ********************
   * Interceptors
   * ********************
   */

  unstable__modifyConnection = (data: { connection: SocketConnectionType<Adapter>; attempt: number }) => {
    return interceptConnection(this.unstable_onConnectCallbacks, data);
  };

  unstable__modifySend = (emitter: EmitterInstance) => {
    return interceptEmitter(this.unstable_onSendCallbacks, emitter);
  };

  unstable__modifyResponse = (data: { data: any; extra: ExtractAdapterExtraType<Adapter> }) => {
    return interceptListener(this.unstable_onMessageCallbacks, data);
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
      return new Listener<Response, Endpoint, Socket<Adapter>>(this, options);
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
