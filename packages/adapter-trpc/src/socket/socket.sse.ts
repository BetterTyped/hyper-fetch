/* eslint-disable @typescript-eslint/no-use-before-define */
import type { QueryParamsType } from "@hyper-fetch/core";
import { stringifyQueryParams } from "@hyper-fetch/core";
import type { SocketConnectionType } from "@hyper-fetch/sockets";
import {
  EventSourceReadyState,
  SocketAdapter,
  createReconnectingConnection,
  getEventSourceConstructor,
} from "@hyper-fetch/sockets";

import type { TrpcAdapterOptionsType } from "../adapter/adapter.types";
import { getTrpcProcedureUrl } from "../adapter/adapter.utils";
import { TrpcSseEvents, retryableTrpcErrorCode } from "./socket.constants";
import type { TrpcSubscriptionType } from "./socket.subscriptions";
import { createTrpcSubscriptions } from "./socket.subscriptions";
import type { TrpcSocketExtraType, TrpcSseAdapterOptionsType, TrpcSseAdapterType } from "./socket.types";
import { TrpcSocketError, deserializeTrpcOutput, getMalformedMessageError, isRecord, toError } from "./socket.utils";

type StreamType = {
  eventSource: EventSource;
  /** Set by the server in the `connected` event - the stream is restarted when it stays quiet for longer */
  reconnectAfterInactivityMs: number;
  inactivityTimer?: ReturnType<typeof setTimeout>;
  /** Limits how long the stream may take to open (`socket.connectionTimeout`), also while the browser retries it */
  openTimer?: ReturnType<typeof setTimeout>;
};

/**
 * Socket adapter for tRPC subscriptions over Server-Sent Events. It speaks the protocol of `httpSubscriptionLink`
 * and the tRPC HTTP handlers (`createHTTPServer`, `fetchRequestHandler` and the other adapters).
 *
 * Every procedure called with one input gets its own `EventSource` (`GET {url}/user.onUpdate?input=...`), shared by
 * the listeners with that input. The socket is connected once the connection details are resolved - the streams
 * are opened then, and closed on `disconnect()`. Restarted streams send the id of the last `tracked()` event,
 * so the server can resume. Server-Sent Events are receive-only - `emit` throws.
 *
 * @example
 * const socket = new Socket({ url: "http://localhost:3000/trpc", adapter: TrpcSseAdapter({ transformer: superjson }) });
 * const api = createSocketSdk<typeof socket, TrpcSocketSchema<AppRouter>>(socket, { camelCaseToKebabCase: false });
 *
 * api.user.onUpdate.$listener.setPayload({ id: 1 }).listen(({ data, extra }) => {});
 */
export const TrpcSseAdapter = ({ transformer }: TrpcAdapterOptionsType = {}): TrpcSseAdapterType =>
  new SocketAdapter<
    TrpcSocketExtraType,
    TrpcSseAdapterOptionsType,
    undefined,
    undefined,
    QueryParamsType | string,
    typeof stringifyQueryParams
  >({
    name: "trpc-sse",
    // Every stream is confirmed with the `connected` event and ends with `return` or an error
    confirmsSubscriptions: true,
  })
    .setQueryParamsMapper(stringifyQueryParams)
    .setConnector((bindings) => {
      const { socket, adapter, getQueryParams, onError } = bindings;

      // Connection details of the active connection (after onConnect interceptors), `null` while disconnected
      let connection: SocketConnectionType<TrpcSseAdapterType> | null = null;

      // The stream in use for each subscription. Events of any other instance (replaced or closed) are ignored.
      const streams = new Map<TrpcSubscriptionType, StreamType>();

      const subscriptions = createTrpcSubscriptions({
        bindings,
        transformer,
        onStart: (subscription) => openStream(subscription),
        onStop: (subscription) => closeStream(subscription),
      });

      /**
       * Streams
       */

      const closeStream = (subscription: TrpcSubscriptionType) => {
        const stream = streams.get(subscription);
        if (!stream) {
          return;
        }
        streams.delete(subscription);
        clearTimeout(stream.inactivityTimer);
        clearTimeout(stream.openTimer);
        stream.eventSource.close();
        // A stream opened again has to be confirmed by the server again
        subscriptions.unconfirm(subscription);
      };

      /** The server ended the subscription - it returned (`error: null`), failed or rejected the stream */
      const endSubscription = (subscription: TrpcSubscriptionType, error: Error | null) => {
        closeStream(subscription);
        if (error) {
          onError({ error });
        }
        subscriptions.end(subscription, error);
      };

      const createEventSource = (url: string) => {
        try {
          const EventSourceConstructor = getEventSourceConstructor(connection?.adapterOptions);
          if (!EventSourceConstructor) {
            onError({ error: new Error("EventSource is not available in this environment") });
            return null;
          }
          return new EventSourceConstructor(url, connection?.adapterOptions?.eventSourceInit);
        } catch (error) {
          onError({ error: toError(error) });
          return null;
        }
      };

      const getStreamUrl = (
        subscription: TrpcSubscriptionType,
        { url, queryParams, adapterOptions }: SocketConnectionType<TrpcSseAdapterType>,
      ) => {
        const protocolParams: Record<string, string> = {};
        if (subscription.lastEventId !== null) {
          protocolParams.lastEventId = subscription.lastEventId;
        }
        if (adapterOptions?.connectionParams) {
          protocolParams.connectionParams = JSON.stringify(adapterOptions.connectionParams);
        }
        return getTrpcProcedureUrl({
          url,
          endpoint: subscription.path,
          queryParams: getQueryParams(queryParams),
          input: subscription.encodedInput,
          protocolParams,
        });
      };

      const openStream = (subscription: TrpcSubscriptionType) => {
        // Not connected yet - every subscription is opened when the socket connects
        if (!connection || !adapter.connected) {
          return;
        }
        closeStream(subscription);

        const eventSource = createEventSource(getStreamUrl(subscription, connection));
        if (!eventSource) {
          return;
        }

        const stream: StreamType = { eventSource, reconnectAfterInactivityMs: 0 };
        streams.set(subscription, stream);

        const isCurrent = () => streams.get(subscription) === stream;

        // The server answers every stream with `connected` - a stream that does not get it in time is opened again
        const guardOpen = () => {
          clearTimeout(stream.openTimer);
          stream.openTimer = setTimeout(() => {
            onError({
              error: new Error(
                `The stream of ${subscription.path} did not open within ${socket.connectionTimeout}ms - restarting it`,
              ),
            });
            openStream(subscription);
          }, socket.connectionTimeout);
        };
        guardOpen();

        const onActivity = () => {
          clearTimeout(stream.inactivityTimer);
          if (stream.reconnectAfterInactivityMs > 0) {
            stream.inactivityTimer = setTimeout(() => {
              onError({
                error: new Error(
                  `No events for ${stream.reconnectAfterInactivityMs}ms - restarting the stream of ${subscription.path}`,
                ),
              });
              openStream(subscription);
            }, stream.reconnectAfterInactivityMs);
          }
        };

        eventSource.addEventListener(TrpcSseEvents.CONNECTED, (event) => {
          if (!isCurrent()) {
            return;
          }
          clearTimeout(stream.openTimer);
          try {
            const options: unknown = JSON.parse(event.data);
            const inactivityMs = isRecord(options) ? options.reconnectAfterInactivityMs : undefined;
            stream.reconnectAfterInactivityMs = typeof inactivityMs === "number" ? inactivityMs : 0;
          } catch (error) {
            onError({ error: getMalformedMessageError(error) });
          }
          onActivity();
          // Every stream starts with `connected` - also after the EventSource reconnected on its own
          subscriptions.confirm(subscription);
        });

        eventSource.addEventListener(TrpcSseEvents.PING, () => {
          if (isCurrent()) {
            onActivity();
          }
        });

        eventSource.addEventListener("message", (event) => {
          if (!isCurrent()) {
            return;
          }
          onActivity();
          let data: unknown;
          try {
            data = deserializeTrpcOutput(JSON.parse(event.data), transformer);
          } catch (error) {
            onError({ error: getMalformedMessageError(error) });
            return;
          }
          // Tracked events carry their id in the `id` field of the event
          subscriptions.deliver(subscription, { data, eventId: event.lastEventId || null });
        });

        eventSource.addEventListener(TrpcSseEvents.SERIALIZED_ERROR, (event) => {
          if (!isCurrent()) {
            return;
          }
          let shape: unknown;
          try {
            shape = deserializeTrpcOutput(JSON.parse(event.data), transformer);
          } catch (error) {
            endSubscription(subscription, getMalformedMessageError(error));
            return;
          }
          const error = new TrpcSocketError({ shape, topic: subscription.topic, payload: subscription.payload });
          // Like `httpSubscriptionLink`, the stream of a retryable error is left open - the EventSource reconnects
          // when the server closes it. Every other error ends the subscription.
          if (isRecord(shape) && shape.code === retryableTrpcErrorCode) {
            onError({ error });
            return;
          }
          endSubscription(subscription, error);
        });

        // The procedure returned - the subscription is complete
        eventSource.addEventListener(TrpcSseEvents.RETURN, () => {
          if (isCurrent()) {
            endSubscription(subscription, null);
          }
        });

        eventSource.addEventListener("error", (event) => {
          if (!isCurrent()) {
            return;
          }
          clearTimeout(stream.inactivityTimer);
          // CLOSED - the server rejected the stream (e.g. a status other than 200), the EventSource gives up.
          // CONNECTING - the stream was lost, the EventSource reconnects on its own and sends `Last-Event-ID`.
          if (eventSource.readyState === EventSourceReadyState.CLOSED) {
            endSubscription(subscription, new Error(`The stream of ${subscription.path} failed`, { cause: event }));
            return;
          }
          subscriptions.unconfirm(subscription);
          guardOpen();
          onError({ error: new Error(`The stream of ${subscription.path} was lost, reconnecting`, { cause: event }) });
        });
      };

      /**
       * Connection
       */

      /**
       * Streams have no shared transport and no shared handshake - the connection is ready as soon as its details are
       * resolved, and every stream recovers on its own. Closing the connection closes every stream, the subscriptions
       * are kept and opened again on the next connection.
       */
      const reconnecting = createReconnectingConnection({
        bindings,
        autoConnect: adapter.adapterOptions?.autoConnect ?? true,
        open: (attempt) => {
          const details = attempt.connection;
          connection = details;
          attempt.ready();
          subscriptions.getAll().forEach(openStream);
          return {
            close: () => {
              // A closed stream is detached - whatever it reports later does not reach the socket anymore. The engine
              // closes an attempt before it opens the next one, so these are always the current details.
              connection = null;
              [...streams.keys()].forEach(closeStream);
            },
          };
        },
      });

      // Server-Sent Events are receive-only. Throwing synchronously makes `emitter.emit()` fail right at the
      // call site instead of leaving a rejected promise nobody awaits.
      const emit = () => {
        throw new Error("Cannot emit events with the tRPC SSE adapter, it supports subscriptions only");
      };

      return {
        connect: reconnecting.connect,
        reconnect: reconnecting.reconnect,
        disconnect: reconnecting.disconnect,
        listen: subscriptions.listen,
        emit,
        // The socket is destroyed or the adapter moves to another socket - stop following the network state
        dispose: reconnecting.dispose,
      };
    });
