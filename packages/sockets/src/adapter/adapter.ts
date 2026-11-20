import type {
  DefaultMapperType,
  EmptyTypes,
  QueryParamsMapper,
  QueryParamsType,
  QueryStringifyOptionsType,
} from "@hyper-fetch/core";
import { defaultMapper } from "@hyper-fetch/core";
import type { EmitterInstance } from "emitter";
import type { ListenerOfAdapter, ListenerCallbackType } from "listener";
import type { Socket, SocketInstance } from "socket";
import type { ExtractAdapterExtraType } from "types";

import { getAdapterBindings } from "./adapter.bindings";
import type { Connector, ListenerLifecycleType, RemoveListenerCallbackType } from "./adapter.types";

export class SocketAdapter<
  Extra = undefined,
  AdapterOptions extends Record<string, any> | EmptyTypes = undefined,
  ListenerOptions extends Record<string, any> | EmptyTypes = undefined,
  EmitterOptions extends Record<string, any> | EmptyTypes = undefined,
  QueryParams extends QueryParamsType | string | EmptyTypes = undefined,
  QueryParamsMapperType extends QueryParamsMapper<any> | DefaultMapperType = DefaultMapperType,
  ListenerQueryParams = undefined,
> {
  public name: string;
  public socket: SocketInstance;
  public defaultExtra?: Extra = undefined;

  public queryParams?: QueryParams = undefined;
  public queryParamsConfig?: QueryStringifyOptionsType = undefined;

  /** Config for the query params mapper */
  public unstable_queryParamsMapperConfig: Parameters<QueryParamsMapperType>[1];
  /** Method to get request data and transform them to the required format.  */
  public unstable_queryParamsMapper: QueryParamsMapperType = defaultMapper as QueryParamsMapperType;
  /**
   * Turns listener query params given as a callback into data, at the moment they are set on a listener. Unset by
   * default, so adapters without it store them as given. See {@link SocketAdapter.setListenerQueryParamsResolver}.
   */
  public unstable_listenerQueryParamsResolver?: (callback: (...args: any[]) => unknown) => unknown = undefined;
  /** Type-only marker for the query params listeners of this adapter accept. */
  declare readonly __listenerQueryParams?: ListenerQueryParams;

  public adapterOptions: AdapterOptions | EmptyTypes;
  public listenerOptions: ListenerOptions | EmptyTypes;
  public emitterOptions: EmitterOptions | EmptyTypes;

  private getConnector: () => Connector<this>;

  // State
  public connected = false;
  public connecting = false;
  public reconnectionAttempts = 0;
  public forceClosed = false;

  // Listeners
  public listeners = new Map<string, Map<ListenerCallbackType<this, any>, VoidFunction>>();
  /**
   * Start and end handlers of the registered callbacks, set by `Listener.listen()`.
   * Adapters call them through the `onListenerStart` / `onListenerEnd` bindings.
   */
  public listenerLifecycle = new Map<string, Map<ListenerCallbackType<this, any>, ListenerLifecycleType>>();
  /**
   * `true` when the server confirms every subscription (e.g. tRPC `started`) - the adapter calls `onListenerStart`.
   * Otherwise a listener counts as started as soon as it is registered.
   */
  public confirmsSubscriptions: boolean;
  public listen: (
    listener: ListenerOfAdapter<this>,
    callback: ListenerCallbackType<this, any>,
  ) => RemoveListenerCallbackType;
  public emit: (emitter: EmitterInstance) => void;
  public connect: () => void;
  public reconnect: () => void;
  public disconnect: () => void;
  /** Cleanup of the current connector - see `dispose()` */
  private disposeConnector: (() => void) | undefined;

  constructor(
    public options: {
      name: string;
      queryParams?: QueryParams;
      defaultConnected?: boolean;
      defaultConnecting?: boolean;
      defaultReconnectionAttempts?: number;
      defaultForceClosed?: boolean;
      /**
       * Set it when the server confirms every subscription and the adapter reports it with `onListenerStart`.
       * @default false
       */
      confirmsSubscriptions?: boolean;
    },
  ) {
    this.name = options.name;
    this.confirmsSubscriptions = options.confirmsSubscriptions ?? false;
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
    // The adapter moves to another socket - the subscriptions of the previous connector must not keep running
    this.dispose();
    this.socket = socket;
    this.adapterOptions = { ...this.adapterOptions, ...socket.options.adapterOptions };

    const { listen, emit, connect, reconnect, disconnect, dispose } = this.getConnector();
    this.listen = listen;
    this.emit = emit;
    this.connect = connect;
    this.reconnect = reconnect;
    this.disconnect = disconnect;
    this.disposeConnector = dispose;

    return this;
  }

  /**
   * Removes the subscriptions the connector made outside of the connection (e.g. the app manager's online event).
   * Called by `socket.destroy()` and before the adapter is initialized again. Safe to call more than once.
   */
  public dispose() {
    const dispose = this.disposeConnector;
    this.disposeConnector = undefined;
    dispose?.();
  }

  public setQueryParams(queryParams: QueryParams) {
    this.queryParams = queryParams;
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
    this.unstable_queryParamsMapperConfig = config;
    return this;
  };

  /**
   * Set the query params mapping function which get triggered before request get sent
   */
  public setQueryParamsMapper = <NewQueryParamsMapper extends QueryParamsMapper<QueryParams>>(
    queryParamsMapper: NewQueryParamsMapper,
  ) => {
    this.unstable_queryParamsMapper = ((queryParams: Parameters<NewQueryParamsMapper>[0]) =>
      queryParamsMapper(
        queryParams,
        this.unstable_queryParamsMapperConfig as Parameters<NewQueryParamsMapper>[1],
      )) as unknown as QueryParamsMapperType;
    return this as unknown as SocketAdapter<
      Extra,
      AdapterOptions,
      ListenerOptions,
      EmitterOptions,
      QueryParams,
      NewQueryParamsMapper,
      ListenerQueryParams
    >;
  };

  /**
   * Let listeners take query params as a callback. When a listener gets a function as its query params (in
   * `createListener` or `setQueryParams`), the resolver runs right away and the listener stores what it returns, so a
   * listener never holds a function. The resolver decides what the callback receives.
   *
   * Opt-in: adapters without a resolver store listener query params as given.
   *
   * @example
   * // The Firebase socket adapter passes a constraints builder and stores the constraints it collected
   * adapter.setListenerQueryParamsResolver((callback) => callback(createConstraints()).toJSON());
   */
  public setListenerQueryParamsResolver = (resolver: (callback: (...args: any[]) => unknown) => unknown) => {
    this.unstable_listenerQueryParamsResolver = resolver;
    return this;
  };

  // Listeners

  /** Registers what the callback does when its subscription starts or ends - set by `Listener.listen()` */
  public setListenerLifecycle = ({
    topic,
    callback,
    lifecycle,
  }: {
    topic: string;
    callback: ListenerCallbackType<
      SocketAdapter<
        Extra,
        AdapterOptions,
        ListenerOptions,
        EmitterOptions,
        QueryParams,
        QueryParamsMapperType,
        ListenerQueryParams
      >,
      any
    >;
    lifecycle: ListenerLifecycleType;
  }) => {
    const group = this.listenerLifecycle.get(topic) ?? new Map();
    group.set(callback, lifecycle);
    this.listenerLifecycle.set(topic, group);
  };

  private deleteListenerLifecycle = ({
    topic,
    callback,
  }: {
    topic: string;
    callback: ListenerCallbackType<
      SocketAdapter<
        Extra,
        AdapterOptions,
        ListenerOptions,
        EmitterOptions,
        QueryParams,
        QueryParamsMapperType,
        ListenerQueryParams
      >,
      any
    >;
  }) => {
    const group = this.listenerLifecycle.get(topic);
    group?.delete(callback);
    if (group && group.size === 0) {
      this.listenerLifecycle.delete(topic);
    }
  };

  public removeListener = ({
    topic,
    callback,
  }: {
    topic: string;
    callback: ListenerCallbackType<
      SocketAdapter<
        Extra,
        AdapterOptions,
        ListenerOptions,
        EmitterOptions,
        QueryParams,
        QueryParamsMapperType,
        ListenerQueryParams
      >,
      any
    >;
  }): boolean => {
    const listenerGroup = this.listeners.get(topic);
    this.deleteListenerLifecycle({ topic, callback });
    // Removing a callback that is not registered (anymore) is a no-op - the remove event fires once per listener
    if (!listenerGroup?.has(callback)) {
      return false;
    }
    const unmount = listenerGroup.get(callback);
    listenerGroup.delete(callback);
    this.socket.events.emitListenerRemoveEvent({ topic });
    unmount?.();
    return true;
  };

  /**
   * Delivers a message to the listeners of the topic. Pass `callbacks` to deliver it only to those listeners -
   * adapters use it when one topic carries several subscriptions, e.g. the same procedure with different payloads.
   */
  public triggerListeners = ({
    topic,
    data,
    extra,
    callbacks: targets,
  }: {
    topic: string;
    data: any;
    extra: ExtractAdapterExtraType<
      SocketAdapter<
        Extra,
        AdapterOptions,
        ListenerOptions,
        EmitterOptions,
        QueryParams,
        QueryParamsMapperType,
        ListenerQueryParams
      >
    >;
    callbacks?: ReadonlySet<ListenerCallbackType<any, any>>;
  }) => {
    const listenerGroup = this.listeners.get(topic);
    if (!listenerGroup?.size) {
      return;
    }

    // Dispatch to the listeners registered when the message arrived: the ones added by a callback wait for the
    // next message, the ones removed by a callback are skipped.
    const callbacks = [...listenerGroup.keys()];
    const errors: unknown[] = [];
    callbacks.forEach((action) => {
      if (!listenerGroup.has(action) || (targets && !targets.has(action))) {
        return;
      }
      try {
        action({ data, extra: extra as ExtractAdapterExtraType<this> });
      } catch (error) {
        // One failing callback must not starve the other listeners of the topic
        errors.push(error);
      }
    });

    if (errors.length > 0) {
      throw errors[0];
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

  public setConnector = (connector: (bindings: ReturnType<typeof getAdapterBindings<this>>) => Connector<this>) => {
    this.getConnector = () => {
      const bindings = getAdapterBindings<this>(this.socket as Socket<this>);

      return connector(bindings);
    };

    return this;
  };
}
