import type { SocketAdapterInstance } from "adapter";
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

    socket.adapter.setForceClosed(false);
    socket.adapter.setConnecting(true);
    socket.adapter.setReconnectionAttempts(0);
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
      // Restore only if the connection didn't succeed — onConnected resets to 0 on success
      if (!adapter.connected) {
        socket.adapter.setReconnectionAttempts(nextAttempts);
      }
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

  const onEmit = async ({ emitter }: { emitter: EmitterInstance }): Promise<EmitterInstance | null> => {
    if (adapter.connecting || !adapter.connected) {
      logger.error({ title: "Cannot emit event when connection is not open", type: "system", extra: {} });
      return null;
    }

    // eslint-disable-next-line no-param-reassign
    emitter.payload = emitter.unstable_payloadMapper
      ? emitter.unstable_payloadMapper(emitter.payload)
      : emitter.payload;

    const emitterInstance = await socket.unstable__modifySend(emitter);
    socket.events.emitEmitterStartEvent({ emitter: emitterInstance });

    return emitterInstance;
  };

  const onEmitError = <ErrorType extends Error>({ emitter, error }: { emitter: EmitterInstance; error: ErrorType }) => {
    socket.events.emitEmitterError({ error, emitter });
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

  const onEvent = ({ topic, data, extra }: { topic: string; data: any; extra: ExtractAdapterExtraType<T> }) => {
    logger.info({ title: "New event message", type: "system", extra: { topic, data, extra } });

    const { data: modifiedData, extra: modifiedExtra } = socket.unstable__modifyResponse({ data, extra });
    socket.adapter.triggerListeners({ topic, data: modifiedData, extra: modifiedExtra });
    socket.events.emitListenerEvent({ topic, data: modifiedData, extra: modifiedExtra });
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
  };
};
