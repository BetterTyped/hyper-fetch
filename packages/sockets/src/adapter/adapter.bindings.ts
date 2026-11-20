import type { ListenerLifecycleType, SocketAdapterInstance } from "adapter";
import type { EmitterInstance } from "emitter";
import type { ListenerCallbackType, ListenerOfAdapter } from "listener";
import type { Socket, SocketConnectionType } from "socket";
import type { ExtractAdapterExtraType, ExtractAdapterQueryParamsType } from "types";

export const getAdapterBindings = <T extends SocketAdapterInstance>(socket: Socket<T>) => {
  const { adapter } = socket;
  const logger = socket.loggerManager.initialize(socket, "Socket Bindings");

  // Every connection attempt gets an id, so an attempt that was cancelled or superseded while
  // its connection was being prepared (async interceptors) can be discarded safely.
  let connectionId = 0;

  const onError = ({ error }: { error: Error }) => {
    logger.info({ title: "Error message", type: "system", extra: { error } });
    socket.unstable_onErrorCallbacks.forEach((callback) => {
      callback({ error });
    });
    socket.events.emitError({ error });
  };

  // Methods

  /**
   * Marks the current connection attempt as failed before any transport was established
   * (e.g. an `onConnect` interceptor threw or the transport could not be created).
   */
  const onConnectFailed = ({ error }: { error: Error }) => {
    logger.error({ title: "Connection attempt failed", type: "system", extra: { error } });
    socket.adapter.setConnecting(false);
    socket.events.emitConnecting({ connecting: false });
    onError({ error });
  };

  /**
   * Opens a connection attempt. Returns the connection details (after `onConnect` interceptors) that the adapter
   * should use to establish the connection, or `null` when no attempt should be made right now
   * (already connected, offline, another attempt in progress or the interceptors failed).
   */
  const onConnect = async (): Promise<SocketConnectionType<T> | null> => {
    if (adapter.connected) {
      logger.debug({
        title: "Already connected, use reconnect to establish a new connection",
        type: "system",
        extra: {},
      });
      return null;
    }
    if (!socket.appManager.isOnline || adapter.connecting) {
      logger.warning({
        title: "Cannot initialize adapter.",
        type: "system",
        extra: {
          connecting: adapter.connecting,
          online: socket.appManager.isOnline,
        },
      });
      return null;
    }

    // Set by onReconnect before it calls connect - 0 means a fresh connection
    const attempt = adapter.reconnectionAttempts;
    connectionId += 1;
    const currentConnectionId = connectionId;

    // The attempts counter is kept on purpose - it is reset only by a successful connection (onConnected)
    // or a disconnect, so attempts that never open (e.g. a hanging handshake) still count towards the limit
    socket.adapter.setForceClosed(false);
    socket.adapter.setConnecting(true);
    socket.events.emitConnecting({ connecting: true });

    const defaults: SocketConnectionType<T> = {
      url: socket.url,
      queryParams: adapter.queryParams,
      adapterOptions: adapter.adapterOptions,
    };

    let connection: SocketConnectionType<T>;
    try {
      // Yield once so callbacks chained right after socket creation (`new Socket().onConnect(...)`)
      // are registered before the interceptors of the first (auto) connection are collected
      await Promise.resolve();
      connection = await socket.unstable__modifyConnection({ connection: defaults, attempt });
    } catch (error) {
      onConnectFailed({ error: error instanceof Error ? error : new Error(String(error)) });
      return null;
    }

    const cancelled = currentConnectionId !== connectionId || !adapter.connecting;
    if (cancelled) {
      logger.debug({ title: "Connection attempt cancelled while preparing", type: "system", extra: { attempt } });
      return null;
    }

    return connection;
  };

  const onDisconnect = (): boolean => {
    logger.debug({
      title: "Disconnecting",
      type: "system",
      extra: { reconnectionAttempts: adapter.reconnectionAttempts },
    });
    socket.adapter.setConnected(false);
    socket.adapter.setConnecting(false);
    socket.adapter.setForceClosed(true);
    socket.adapter.setReconnectionAttempts(0);
    return true;
  };

  const onReconnect = async ({
    disconnect,
    connect,
  }: {
    disconnect: () => Promise<any>;
    connect: () => Promise<any>;
  }): Promise<boolean> => {
    // Capture attempts before disconnect/connect reset them
    const currentAttempts = adapter.reconnectionAttempts;

    socket.unstable_onReconnectCallbacks.forEach((callback) => {
      callback();
    });
    socket.events.emitReconnecting({ attempts: currentAttempts });

    await disconnect();
    if (currentAttempts < socket.reconnectAttempts) {
      const nextAttempts = currentAttempts + 1;
      socket.adapter.setReconnectionAttempts(nextAttempts);
      logger.debug({
        title: "Reconnecting",
        type: "system",
        extra: { reconnectionAttempts: nextAttempts },
      });
      await connect();
      return true;
    }

    logger.error({
      title: "Stopped reconnecting",
      type: "system",
      extra: { reconnectionAttempts: currentAttempts },
    });
    socket.unstable_onReconnectFailedCallbacks.forEach((callback) => {
      callback();
    });
    socket.events.emitReconnectingFailed({ attempts: currentAttempts });
    return false;
  };

  // Listeners

  const onListen = ({
    listener,
    callback,
    onUnmount = () => null,
  }: {
    listener: Pick<ListenerOfAdapter<T>, "topic">;
    callback: ListenerCallbackType<T, any>;
    onUnmount?: VoidFunction;
  }): (() => void) => {
    const listenerGroup = (adapter.listeners.get(listener.topic) ||
      adapter.listeners.set(listener.topic, new Map()).get(listener.topic)) as Map<
      ListenerCallbackType<T, any>,
      VoidFunction
    >;

    listenerGroup.set(callback, onUnmount);
    return () => socket.adapter.removeListener({ topic: listener.topic, callback });
  };

  // Emitters

  const onEmitError = <ErrorType extends Error>({ emitter, error }: { emitter: EmitterInstance; error: ErrorType }) => {
    socket.events.emitEmitterError({ error, emitter });
  };

  /**
   * Prepares an emitter for sending - maps the payload and runs the `onSend` interceptors.
   * Returns `null` when the message cannot be sent; the reason is reported with the emitter error event
   * (and to the `onError` callbacks when the payload mapper or an interceptor failed), it never rejects.
   */
  const onEmit = async ({ emitter }: { emitter: EmitterInstance }): Promise<EmitterInstance | null> => {
    if (adapter.connecting || !adapter.connected) {
      const error = new Error("Cannot emit event when connection is not open");
      logger.error({ title: error.message, type: "system", extra: {} });
      onEmitError({ emitter, error });
      return null;
    }

    try {
      // eslint-disable-next-line no-param-reassign
      emitter.payload = emitter.unstable_payloadMapper
        ? await emitter.unstable_payloadMapper(emitter.payload)
        : emitter.payload;

      const emitterInstance = await socket.unstable__modifySend(emitter);
      socket.events.emitEmitterStartEvent({ emitter: emitterInstance });

      return emitterInstance;
    } catch (error) {
      const emitError = error instanceof Error ? error : new Error(String(error));
      logger.error({ title: "Cannot prepare event to emit", type: "system", extra: { error: emitError } });
      onEmitError({ emitter, error: emitError });
      onError({ error: emitError });
      return null;
    }
  };

  // Lifecycle

  const onConnected = () => {
    logger.info({ title: "Connection open", type: "system", extra: {} });
    adapter.setConnected(true);
    adapter.setConnecting(false);
    adapter.setReconnectionAttempts(0);
    socket.events.emitConnecting({ connecting: false });
    socket.events.emitConnected();
    socket.unstable_onConnectedCallbacks.forEach((callback) => {
      callback();
    });
  };

  const onDisconnected = () => {
    logger.info({ title: "Connection closed", type: "system", extra: {} });
    adapter.setConnected(false);
    adapter.setConnecting(false);
    socket.events.emitConnecting({ connecting: false });
    socket.events.emitDisconnected();
    socket.unstable_onDisconnectCallbacks.forEach((callback) => {
      callback();
    });
  };

  /**
   * Delivers an incoming message through the `onMessage` interceptors to the listeners of the topic.
   * `callbacks` limits the delivery to those listeners, for adapters where one topic carries several subscriptions.
   */
  const onEvent = ({
    topic,
    data,
    extra,
    callbacks,
  }: {
    topic: string;
    data: any;
    extra: ExtractAdapterExtraType<T>;
    callbacks?: ReadonlySet<ListenerCallbackType<T, any>>;
  }) => {
    logger.info({ title: "New event message", type: "system", extra: { topic, data, extra } });

    let message: { data: any; extra: ExtractAdapterExtraType<T> };
    try {
      message = socket.unstable__modifyResponse({ data, extra, topic });
    } catch (error) {
      // A failing `onMessage` interceptor must not break the transport - skip the message and report it
      onError({ error: error instanceof Error ? error : new Error(String(error)) });
      return;
    }

    try {
      socket.adapter.triggerListeners({ topic, data: message.data, extra: message.extra, callbacks });
    } finally {
      // Devtools and global subscriptions receive the message even when a listener callback throws
      socket.events.emitListenerEvent({ topic, data: message.data, extra: message.extra });
    }
  };

  /**
   * Runs one lifecycle handler for each registered callback of `callbacks`. A handler that throws is reported
   * with `onError` and does not stop the others.
   */
  const runLifecycle = ({
    topic,
    callbacks,
    run,
  }: {
    topic: string;
    callbacks: ReadonlySet<ListenerCallbackType<T, any>>;
    run: (lifecycle: ListenerLifecycleType | undefined, callback: ListenerCallbackType<T, any>) => void;
  }) => {
    const registered = socket.adapter.listeners.get(topic);
    const lifecycles = socket.adapter.listenerLifecycle.get(topic);
    [...callbacks].forEach((callback) => {
      if (!registered?.has(callback)) {
        return;
      }
      try {
        run(lifecycles?.get(callback), callback);
      } catch (error) {
        onError({ error: error instanceof Error ? error : new Error(String(error)) });
      }
    });
  };

  /**
   * The server confirmed the subscription of `callbacks` - call it for adapters created with
   * `confirmsSubscriptions: true`, also when a subscription is restarted after a reconnect and when a callback joins
   * a subscription that is already running.
   */
  const onListenerStart = ({
    topic,
    callbacks,
  }: {
    topic: string;
    callbacks: ReadonlySet<ListenerCallbackType<T, any>>;
  }) => {
    logger.debug({ title: "Subscription started", type: "system", extra: { topic } });
    runLifecycle({ topic, callbacks, run: (lifecycle) => lifecycle?.onStart() });
    socket.events.emitListenerStartEvent({ topic });
  };

  /**
   * The server ended the subscription of `callbacks`, with `error` when it failed. Their listeners deliver what is
   * still pending, unsubscribe and call their `onEnd` - restarting it takes a new `listen()`.
   */
  const onListenerEnd = ({
    topic,
    callbacks,
    error = null,
  }: {
    topic: string;
    callbacks: ReadonlySet<ListenerCallbackType<T, any>>;
    error?: Error | null;
  }) => {
    logger.info({
      title: error ? "Subscription failed" : "Subscription ended",
      type: "system",
      extra: { topic, error },
    });
    runLifecycle({
      topic,
      callbacks,
      run: (lifecycle, callback) => {
        if (lifecycle) {
          lifecycle.onEnd({ error });
          return;
        }
        // Registered without `Listener.listen()` - the subscription is over, so the registration goes too
        socket.adapter.removeListener({ topic, callback });
      },
    });
    socket.events.emitListenerEndEvent({ topic, error });
  };

  /** Maps query params to the format required by the adapter (defaults to the adapter's stored query params) */
  const getQueryParams = (queryParams: ExtractAdapterQueryParamsType<T> | undefined = adapter.queryParams) =>
    socket.adapter.unstable_queryParamsMapper(queryParams, socket.adapter.queryParamsConfig);

  return {
    socket,
    adapter: socket.adapter,
    logger,
    getQueryParams,
    onConnect,
    onConnectFailed,
    onReconnect,
    onDisconnect,
    onListen,
    onEmit,
    onEmitError,
    onConnected,
    onDisconnected,
    onError,
    onEvent,
    onListenerStart,
    onListenerEnd,
  };
};
