import {
  defaultMapper,
  DefaultMapperType,
  EmptyTypes,
  QueryParamsMapper,
  QueryParamsType,
  QueryStringifyOptionsType,
} from "@hyper-fetch/core";

import { Socket, SocketInstance } from "socket";
import { Connector, RemoveListenerCallbackType } from "./adapter.types";
import { getAdapterBindings } from "./adapter.bindings";
import { ListenerInstance, ListenerCallbackType } from "listener";
import { EmitterInstance } from "emitter";
import { ExtractAdapterExtraType } from "types";

export class SocketAdapter<
  Extra = undefined,
  AdapterOptions extends Record<string, any> | EmptyTypes = undefined,
  ListenerOptions extends Record<string, any> | EmptyTypes = undefined,
  EmitterOptions extends Record<string, any> | EmptyTypes = undefined,
  QueryParams extends QueryParamsType | string | EmptyTypes = undefined,
  QueryParamsMapperType extends QueryParamsMapper<any> | DefaultMapperType = DefaultMapperType,
> {
  public name: string;
  public socket: SocketInstance;
  public defaultExtra?: Extra;

  public queryParams?: QueryParams;
  public queryParamsConfig?: QueryStringifyOptionsType;

  /** Config for the query params mapper */
  public unsafe_queryParamsMapperConfig: Parameters<QueryParamsMapperType>[1];
  /** Method to get request data and transform them to the required format.  */
  public unsafe_queryParamsMapper: QueryParamsMapperType = defaultMapper as QueryParamsMapperType;

  public adapterOptions: AdapterOptions | EmptyTypes;
  public listenerOptions: ListenerOptions | EmptyTypes;
  public emitterOptions: EmitterOptions | EmptyTypes;

  private getConnector: () => Connector;

  // State
  public connected = false;
  public connecting = false;
  public reconnectionAttempts = 0;
  public forceClosed = false;

  // Listeners
  public listeners = new Map<string, Map<ListenerCallbackType<this, any>, VoidFunction>>();
  public listen: (listener: ListenerInstance, callback: ListenerCallbackType<this, any>) => RemoveListenerCallbackType;
  public emit: (emitter: EmitterInstance, data: any) => void;
  public connect: () => void;
  public reconnect: () => void;
  public disconnect: () => void;

  constructor(
    public options: {
      name: string;
      queryParams?: QueryParams;
      defaultConnected?: boolean;
      defaultConnecting?: boolean;
      defaultReconnectionAttempts?: number;
      defaultForceClosed?: boolean;
    },
  ) {
    this.name = options.name;
    this.queryParams = options.queryParams;

    if (options.defaultConnected) {
      this.setConnected(options.defaultConnected);
    }
    if (options.defaultConnecting) {
      this.setConnecting(options.defaultConnecting);
    }
    if (options.defaultReconnectionAttempts) {
      this.setReconnectionAttempts(options.defaultReconnectionAttempts);
    }
    if (options.defaultForceClosed) {
      this.setForceClosed(options.defaultForceClosed);
    }
  }

  public initialize(socket: SocketInstance) {
    this.socket = socket;
    this.adapterOptions = { ...this.adapterOptions, ...socket.options.adapterOptions };

    const { listen, emit, connect, reconnect, disconnect } = this.getConnector();
    this.listen = listen;
    this.emit = emit;
    this.connect = connect;
    this.reconnect = reconnect;
    this.disconnect = disconnect;

    return this;
  }

  public setQueryParams(queryParams: QueryParams) {
    this.queryParams = queryParams;
    this.reconnect?.();
    return this;
  }

  public setQueryParamsConfig(queryParamsConfig: QueryStringifyOptionsType) {
    this.queryParamsConfig = queryParamsConfig;
    return this;
  }

  public setDefaultExtra(defaultExtra: Extra) {
    this.defaultExtra = defaultExtra;
    return this;
  }

  public setOptions(adapterOptions: AdapterOptions | EmptyTypes) {
    this.adapterOptions = adapterOptions;
    return this;
  }

  public setDefaultListenerOptions(listenerOptions: ListenerOptions | EmptyTypes) {
    this.listenerOptions = listenerOptions;
    return this;
  }

  public setDefaultEmitterOptions(emitterOptions: EmitterOptions | EmptyTypes) {
    this.emitterOptions = emitterOptions;
    return this;
  }

  public setQueryParamsMapperConfig = <NewQueryParamsMapperConfig extends Parameters<QueryParamsMapperType>[1]>(
    config: NewQueryParamsMapperConfig,
  ) => {
    this.unsafe_queryParamsMapperConfig = config;
    return this;
  };

  /**
   * Set the query params mapping function which get triggered before request get sent
   */
  public setQueryParamsMapper = <NewQueryParamsMapper extends QueryParamsMapper<QueryParams>>(
    queryParamsMapper: NewQueryParamsMapper,
  ) => {
    this.unsafe_queryParamsMapper = ((queryParams: Parameters<NewQueryParamsMapper>[0]) =>
      queryParamsMapper(
        queryParams,
        this.unsafe_queryParamsMapperConfig as Parameters<NewQueryParamsMapper>[1],
      )) as unknown as QueryParamsMapperType;
    return this as unknown as SocketAdapter<
      Extra,
      AdapterOptions,
      ListenerOptions,
      EmitterOptions,
      QueryParams,
      NewQueryParamsMapper
    >;
  };

  // Listeners

  public removeListener = ({
    topic,
    callback,
  }: {
    topic: string;
    callback: ListenerCallbackType<
      SocketAdapter<Extra, AdapterOptions, ListenerOptions, EmitterOptions, QueryParams, QueryParamsMapperType>,
      any
    >;
  }): boolean => {
    const listenerGroup = this.listeners.get(topic);
    if (listenerGroup) {
      const unmount = listenerGroup.get(callback);
      this.socket.events.emitListenerRemoveEvent({ topic });
      listenerGroup.delete(callback);
      unmount?.();
      return true;
    }
    return false;
  };

  public triggerListeners = ({
    topic,
    data,
    extra,
  }: {
    topic: string;
    data: any;
    extra: ExtractAdapterExtraType<
      SocketAdapter<Extra, AdapterOptions, ListenerOptions, EmitterOptions, QueryParams, QueryParamsMapperType>
    >;
  }) => {
    const listenerGroup = this.listeners.get(topic);
    if (listenerGroup) {
      listenerGroup.forEach((_, action) => {
        action({ data, extra: extra as ExtractAdapterExtraType<this> });
      });
    }
  };

  // State

  setConnected = (connected: boolean) => {
    this.connected = connected;
    return this;
  };

  setConnecting = (connecting: boolean) => {
    this.connecting = connecting;
    return this;
  };

  setReconnectionAttempts = (reconnectionAttempts: number) => {
    this.reconnectionAttempts = reconnectionAttempts;
    return this;
  };

  setForceClosed = (forceClosed: boolean) => {
    this.forceClosed = forceClosed;
    return this;
  };

  // Connector

  public setConnector = (connector: (bindings: ReturnType<typeof getAdapterBindings<this>>) => Connector) => {
    this.getConnector = () => {
      const bindings = getAdapterBindings<this>(this.socket as Socket<this>);

      return connector(bindings);
    };

    return this;
  };
}
