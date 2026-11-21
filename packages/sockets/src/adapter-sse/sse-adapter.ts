/* eslint-disable @typescript-eslint/no-use-before-define */
import type { EmptyTypes, QueryParamsType } from "@hyper-fetch/core";
import { stringifyQueryParams } from "@hyper-fetch/core";
import type { SocketData } from "adapter";
import { SocketAdapter } from "adapter/adapter";
import { createReconnectingConnection } from "connection";
import type { ListenerCallbackType, ListenerOfAdapter } from "listener";

import { getSocketUrl, parseMessageEvent } from "../utils";
import { getSocketError } from "../utils/socket.errors";
import type { SSEAdapterOptionsType, SSEDecodedMessageType } from "./sse-adapter.types";
import { EventSourceReadyState, getServerSentEventsAdapter } from "./sse-adapter.utils";

/**
 * -------------------------------------------
 * Server-Sent Events
 * -------------------------------------------
 */

export type ServerSentEventsAdapterType = SocketAdapter<
  MessageEvent<any>,
  SSEAdapterOptionsType,
  undefined,
  undefined,
  QueryParamsType | string,
  typeof stringifyQueryParams
>;

/** Create a preconfigured socket adapter for Server-Sent Events (EventSource) connections. */
export const ServerSentEventsAdapter = (): ServerSentEventsAdapterType =>
  new SocketAdapter<
    MessageEvent<any>,
    SSEAdapterOptionsType,
    undefined,
    undefined,
    QueryParamsType | string,
    typeof stringifyQueryParams
  >({
    name: "sse",
  })
    .setQueryParamsMapper(stringifyQueryParams)
    .setConnector((bindings) => {
      const { adapter, getQueryParams, onConnectFailed, onListen, onError, onEvent } = bindings;

      // The transport of the current attempt - `undefined` once it is detached
      let sse: ReturnType<typeof getServerSentEventsAdapter> | undefined;

      /** Maps an incoming message to the listener event, reporting decoder failures instead of throwing */
      const decodeMessage = (
        event: MessageEvent<SocketData>,
        decode: SSEAdapterOptionsType["decode"],
      ): SSEDecodedMessageType | null => {
        try {
          if (decode) {
            return decode(event);
          }
          const { topic, data } = parseMessageEvent(event);
          return { topic, data };
        } catch (error) {
          onError({ error: error as Error });
          return null;
        }
      };

      // Named events (`event: tick`) of the current EventSource, one handler per listened topic
      let namedEvents = new Map<string, (event: MessageEvent<SocketData>) => void>();
      // Decoder of the current connection attempt (after the `onConnect` interceptors)
      let connectionDecode: SSEAdapterOptionsType["decode"];

      /** Named events go to the listeners whose topic is the event name - the data is JSON or the raw text */
      const decodeNamedEvent = (
        event: MessageEvent<SocketData>,
        decode: SSEAdapterOptionsType["decode"],
      ): SSEDecodedMessageType | null => {
        if (decode) {
          return decodeMessage(event, decode);
        }
        try {
          return { topic: event.type, data: JSON.parse(String(event.data)) };
        } catch {
          return { topic: event.type, data: event.data };
        }
      };

      /** Starts receiving the named events of the topic on the current EventSource */
      const listenToNamedEvent = (topic: string) => {
        const eventSource = sse;
        // `message` is the unnamed event, it is handled for every topic already
        if (!eventSource || topic === "message" || namedEvents.has(topic)) {
          return;
        }
        const handler = (event: MessageEvent<SocketData>) => {
          if (sse !== eventSource) {
            return;
          }
          const message = decodeNamedEvent(event, connectionDecode);
          if (message) {
            onEvent({ topic: message.topic, data: message.data, extra: event });
          }
        };
        namedEvents.set(topic, handler);
        eventSource.addEventListener(topic as keyof EventSourceEventMap, handler as never);
      };

      /** Stops receiving the named events of a topic nobody listens to anymore */
      const stopNamedEvent = (topic: string) => {
        const handler = namedEvents.get(topic);
        if (!handler || adapter.listeners.get(topic)?.size) {
          return;
        }
        namedEvents.delete(topic);
        sse?.removeEventListener(topic as keyof EventSourceEventMap, handler as never);
      };

      /** Creates the transport, reporting a failed attempt when the environment or the connection details are invalid */
      const createEventSource = (url: string, adapterOptions: SSEAdapterOptionsType | EmptyTypes) => {
        try {
          const instance = getServerSentEventsAdapter(url, adapterOptions);
          if (!instance) {
            onConnectFailed({ error: new Error("EventSource is not available in this environment") });
          }
          return instance;
        } catch (error) {
          onConnectFailed({ error: error as Error });
          return null;
        }
      };

      const connection = createReconnectingConnection({
        bindings,
        autoConnect: adapter.adapterOptions?.autoConnect ?? true,
        open: (attempt) => {
          const url = getSocketUrl(attempt.connection.url, getQueryParams(attempt.connection.queryParams));
          const eventSource = createEventSource(url, attempt.connection.adapterOptions);
          if (!eventSource) {
            return null;
          }
          sse = eventSource;

          // Named events are registered per EventSource - start them again for every topic that has listeners
          connectionDecode = attempt.connection.adapterOptions?.decode;
          namedEvents = new Map();
          adapter.listeners.forEach((callbacks, topic) => {
            if (callbacks.size > 0) {
              listenToNamedEvent(topic);
            }
          });

          // Also the stream that came back after the browser retried it on its own
          eventSource.addEventListener("open", () => {
            if (attempt.isCurrent()) {
              attempt.ready();
            }
          });

          eventSource.addEventListener("error", (event) => {
            if (!attempt.isCurrent()) {
              return;
            }
            const error = new Error(getSocketError(event));
            onError({ error });

            // The browser either retries on its own (CONNECTING) or gave up (CLOSED). A retrying stream keeps its
            // `Last-Event-ID`, so it gets the connection timeout to come back. A stream that gave up is replaced.
            if (eventSource.readyState === EventSourceReadyState.CLOSED) {
              attempt.lost({ error });
            } else if (adapter.connected) {
              attempt.interrupted();
            }
          });

          const { decode } = attempt.connection.adapterOptions || {};
          eventSource.addEventListener("message", (newEvent: MessageEvent<SocketData>) => {
            if (!attempt.isCurrent()) {
              return;
            }
            const message = decodeMessage(newEvent, decode);
            if (message) {
              onEvent({ topic: message.topic, data: message.data, extra: newEvent });
            }
          });

          // No open event follows a stream that is open already
          if (eventSource.readyState === EventSourceReadyState.OPEN) {
            attempt.ready();
          }

          return {
            close: () => {
              if (sse === eventSource) {
                sse = undefined;
              }
              // Listeners stay - the engine ignores a detached stream, and a library wrapping EventSource may need its own
              eventSource.close();
            },
          };
        },
      });

      const listen = (
        listener: ListenerOfAdapter<ServerSentEventsAdapterType>,
        callback: ListenerCallbackType<ServerSentEventsAdapterType, any>,
      ) => {
        const removeListener = onListen({ listener, callback, onUnmount: () => stopNamedEvent(listener.topic) });
        listenToNamedEvent(listener.topic);
        return removeListener;
      };

      // Server-Sent Events are receive-only. Throwing synchronously makes `emitter.emit()` fail right at the
      // call site instead of leaving a rejected promise nobody awaits.
      const emit = () => {
        throw new Error("Cannot emit events in SSE adapter");
      };

      return {
        connect: connection.connect,
        reconnect: connection.reconnect,
        disconnect: connection.disconnect,
        listen,
        emit,
        dispose: connection.dispose,
      };
    });
