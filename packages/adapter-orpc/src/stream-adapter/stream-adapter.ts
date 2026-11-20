/* eslint-disable @typescript-eslint/no-use-before-define */
import type { QueryParamsType } from "@hyper-fetch/core";
import { parseResponse, stringifyQueryParams } from "@hyper-fetch/core";
import type { SocketConnectionType } from "@hyper-fetch/sockets";
import { createReconnectingConnection, SocketAdapter } from "@hyper-fetch/sockets";
import { isORPCErrorStatus } from "@orpc/client";

import { createOrpcSerializer, getOrpcCallRequest, orpcEndpointMapper } from "../adapter/adapter.utils";
import { createOrpcSubscriptions } from "../socket/socket.subscriptions";
import type { OrpcSocketAdapterConfigType, OrpcSocketExtraType, OrpcSubscriptionType } from "../socket/socket.types";
import { getNotIteratorError, getOrpcResponseError } from "../socket/socket.utils";
import type { OrpcStreamAdapterOptionsType, OrpcStreamAdapterType } from "./stream-adapter.types";
import type { OrpcEventStreamMessageType } from "./stream-adapter.utils";
import { createEventStreamDecoder, getEventStreamIteratorEvent } from "./stream-adapter.utils";

/** Server side of one subscription - a running request, or the wait before it starts again */
type StreamTransportType = {
  /** Aborts the running request. It is missing while the stream waits to start again. */
  controller: AbortController | undefined;
  /** Open timeout of the running request, or the delay before the stream starts again */
  timer: ReturnType<typeof setTimeout> | undefined;
  /** Failed starts in a row */
  attempts: number;
  timedOut: boolean;
};

type StreamSubscriptionType = OrpcSubscriptionType<StreamTransportType>;

/**
 * Socket adapter for the event iterators of oRPC over HTTP. Every subscription is a call of the procedure with the
 * RPC protocol - a `POST {url}/planet/onUpdate` with the serialized input - answered with a `text/event-stream`.
 * The same protocol as the `RPCLink` of oRPC, so it works with the `RPCHandler` of `@orpc/server/fetch` or `/node`.
 *
 * There is no shared connection: "connected" means the adapter opens streams. `connect()` starts every
 * subscription, `disconnect()` aborts them, `reconnect()` starts them again with the id of their last event.
 * Listeners of the same procedure and input share one stream, the last one to unsubscribe aborts it.
 * A subscription starts (`onStart`) when the server answers with the event stream, and ends (`onEnd`) when the
 * iterator finishes, fails or the server rejects the call.
 *
 * @example
 * const socket = new Socket({ url: "http://localhost:3000/rpc", adapter: OrpcStreamAdapter() });
 * const sdk = createSocketSdk<typeof socket, OrpcSocketSchema<typeof router>>(socket, { camelCaseToKebabCase: false });
 *
 * sdk.planet.onUpdate.$listener.setPayload({ id: 1 }).listen(({ data, extra }) => console.log(data, extra.id));
 */
export const OrpcStreamAdapter = ({
  customJsonSerializers,
}: OrpcSocketAdapterConfigType = {}): OrpcStreamAdapterType => {
  const serializer = createOrpcSerializer(customJsonSerializers);

  return new SocketAdapter<
    OrpcSocketExtraType,
    OrpcStreamAdapterOptionsType,
    undefined,
    undefined,
    QueryParamsType | string,
    typeof stringifyQueryParams
  >({ name: "orpc-stream", confirmsSubscriptions: true })
    .setQueryParamsMapper(stringifyQueryParams)
    .setConnector((bindings) => {
      const { socket, adapter, getQueryParams, onConnectFailed } = bindings;

      // Details of the current connection (after onConnect interceptors), every stream is opened with them.
      // Set only while the adapter is connected.
      let connection: SocketConnectionType<OrpcStreamAdapterType> | undefined;

      const subscriptions = createOrpcSubscriptions<OrpcStreamAdapterType, StreamTransportType>({
        bindings,
        serializer,
        start: (subscription) => startStream(subscription, 0),
        stop: (subscription) => stopStream(subscription),
        release: (subscription) => stopStream(subscription),
      });

      /**
       * Aborts the request or the wait of the subscription. Whatever the old request reports later is ignored.
       * For a stream the server ended it only releases the response.
       */
      const stopStream = (subscription: StreamSubscriptionType) => {
        const { transport } = subscription;
        subscription.transport = undefined;
        subscription.started = false;
        if (transport) {
          clearTimeout(transport.timer);
          transport.controller?.abort();
        }
      };

      /** After a failure the stream starts again, after the `retry` of the last event or the socket reconnect time */
      const scheduleRestart = (subscription: StreamSubscriptionType, attempts: number) => {
        if (attempts > socket.reconnectAttempts) {
          subscriptions.end(
            subscription,
            new Error(`Stopped restarting the stream of "${subscription.topic}" after ${attempts - 1} attempts`),
          );
          return;
        }

        const transport: StreamTransportType = { controller: undefined, timer: undefined, attempts, timedOut: false };
        // Going offline closes the connection and stops the wait, coming back online starts the stream right away
        transport.timer = setTimeout(() => {
          startStream(subscription, attempts);
        }, subscription.lastEventRetry ?? socket.reconnectTime);
        subscription.transport = transport;
      };

      /** Returns `true` when the server ended the iterator */
      const receiveMessage = (subscription: StreamSubscriptionType, message: OrpcEventStreamMessageType): boolean => {
        try {
          const event = getEventStreamIteratorEvent(message);
          return event ? subscriptions.receive(subscription, event) : false;
        } catch (error) {
          // Data that is not JSON - the message is skipped, the stream goes on
          subscriptions.report(subscription, error);
          return false;
        }
      };

      /**
       * Reads the stream until the server ends it. Resolves the error of a call the server rejected, rejects when
       * the transport failed - the network, the timeout or a stream cut in the middle of a message.
       */
      const readStream = async ({
        subscription,
        transport,
        controller,
        details: { url, queryParams, adapterOptions },
      }: {
        subscription: StreamSubscriptionType;
        transport: StreamTransportType;
        controller: AbortController;
        details: SocketConnectionType<OrpcStreamAdapterType>;
      }): Promise<Error | null> => {
        const { headers, fetchOptions, fetch: customFetch } = adapterOptions ?? {};
        const { lastEventId } = subscription;
        const request = getOrpcCallRequest({
          url,
          endpoint: orpcEndpointMapper(subscription.topic),
          queryParams: getQueryParams(queryParams),
          // The server reads it as `lastEventId` and can resume where the previous stream stopped
          headers: lastEventId === undefined ? { ...headers } : { ...headers, "last-event-id": lastEventId },
          payload: subscription.payload,
          method: "POST",
          serializer,
        });

        // Checked to be a function when connecting
        const fetchStream = customFetch ?? globalThis.fetch;
        const response = await fetchStream(request.url, {
          ...fetchOptions,
          method: request.method,
          headers: request.headers,
          body: request.body,
          signal: controller.signal,
        });
        clearTimeout(transport.timer);

        if (isORPCErrorStatus(response.status)) {
          const body = parseResponse(await response.text());
          return getOrpcResponseError({ status: response.status, body, serializer });
        }
        if (!response.headers.get("content-type")?.startsWith("text/event-stream")) {
          return getNotIteratorError(subscription.topic);
        }
        // The server accepted the call, the next failure counts from the beginning
        transport.attempts = 0;
        // Unless the listeners left while the response was on its way
        if (subscription.transport === transport) {
          subscriptions.confirm(subscription);
        }

        if (!response.body) {
          return null;
        }

        const reader = response.body.getReader();
        const textDecoder = new TextDecoder();
        let ended = false;
        const eventDecoder = createEventStreamDecoder((message) => {
          // Messages after the end, or after the subscription stopped, are not delivered
          if (!ended && subscription.transport === transport) {
            ended = receiveMessage(subscription, message);
          }
        });

        let chunk = await reader.read();
        while (!chunk.done) {
          eventDecoder.feed(textDecoder.decode(chunk.value, { stream: true }));
          if (ended) {
            return null;
          }
          // eslint-disable-next-line no-await-in-loop
          chunk = await reader.read();
        }
        // A stream closed without the `done` event is a finished iterator, the same as in oRPC
        eventDecoder.feed(textDecoder.decode());
        eventDecoder.end();
        return null;
      };

      const startStream = (subscription: StreamSubscriptionType, attempts: number) => {
        // Not connected - the stream starts on connect
        const details = connection;
        if (!details) {
          return;
        }

        const controller = new AbortController();
        const transport: StreamTransportType = { controller, timer: undefined, attempts, timedOut: false };
        subscription.transport = transport;
        const isCurrent = () => subscription.transport === transport;

        // Connection timeout - when the server does not answer in time, the stream starts again
        transport.timer = setTimeout(() => {
          transport.timedOut = true;
          controller.abort();
        }, socket.connectionTimeout);

        readStream({ subscription, transport, controller, details }).then(
          (rejection) => {
            if (!isCurrent()) {
              return;
            }
            // The server ended the iterator or rejected the call - the subscription is over
            subscriptions.end(subscription, rejection ?? undefined);
          },
          (error) => {
            if (!isCurrent()) {
              return;
            }
            stopStream(subscription);
            subscriptions.report(
              subscription,
              transport.timedOut
                ? new Error(`The stream of "${subscription.topic}" did not open in ${socket.connectionTimeout}ms`)
                : error,
            );
            scheduleRestart(subscription, transport.attempts + 1);
          },
        );
      };

      /** Aborts every stream. Listeners stay registered and keep the id of their last event for the next connection. */
      const stopStreams = () => {
        subscriptions.values().forEach(stopStream);
      };

      /**
       * There is no shared transport - the connection is the set of streams opened with its details. It is ready at
       * once, and it is never lost as a whole: every stream fails and starts again on its own (`scheduleRestart`).
       */
      const connectionLifecycle = createReconnectingConnection({
        bindings,
        autoConnect: adapter.adapterOptions?.autoConnect ?? true,
        open: (attempt) => {
          const details = attempt.connection;
          if (typeof (details.adapterOptions?.fetch ?? globalThis.fetch) !== "function") {
            onConnectFailed({ error: new Error("fetch is not available in this environment") });
            return null;
          }

          connection = details;
          attempt.ready();
          subscriptions.values().forEach((subscription) => {
            // A listener added by an `onConnected` callback is running already
            if (!subscription.transport) {
              startStream(subscription, 0);
            }
          });

          return {
            close: () => {
              if (connection === details) {
                connection = undefined;
              }
              stopStreams();
            },
          };
        },
      });

      // Event iterators only send data from the server. Throwing synchronously makes `emitter.emit()` fail right at
      // the call site, the same as in the Server-Sent Events adapter.
      const emit = () => {
        throw new Error("Cannot emit events in the oRPC stream adapter, it only receives events of subscriptions");
      };

      return {
        connect: connectionLifecycle.connect,
        reconnect: connectionLifecycle.reconnect,
        disconnect: connectionLifecycle.disconnect,
        listen: subscriptions.listen,
        emit,
        // Nothing of this connector outlives the socket - no app manager subscriptions, no running or waiting streams
        dispose: () => {
          connectionLifecycle.dispose();
          connection = undefined;
          stopStreams();
        },
      };
    });
};
