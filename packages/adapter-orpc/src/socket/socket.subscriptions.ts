import type {
  ExtractAdapterExtraType,
  getAdapterBindings,
  ListenerCallbackType,
  ListenerOfAdapter,
} from "@hyper-fetch/sockets";
import { createORPCErrorFromJson, ErrorEvent, isORPCErrorJson } from "@orpc/client";

import type { OrpcSerializerType } from "../adapter/adapter.utils";
import { getOrpcSubscriptionKey } from "../adapter/adapter.utils";
import type {
  OrpcIteratorEventType,
  OrpcSocketAdapterInstance,
  OrpcSocketExtraType,
  OrpcSubscriptionType,
} from "./socket.types";
import { deserializeOrpcData, OrpcSocketError, toError } from "./socket.utils";

type BindingsType<Adapter extends OrpcSocketAdapterInstance> = ReturnType<typeof getAdapterBindings<Adapter>>;

/**
 * Keeps one server subscription per procedure and input, shared by every listener with the same topic and payload.
 * The adapter starts and stops the server side, this module counts the listeners, turns the events of the server
 * iterator into listener messages and errors, and reports the lifecycle of the subscription to the listeners.
 *
 * - `start` is called for a subscription that has no running server side. It does nothing until the adapter can
 *   start it, the adapter starts the rest when it connects.
 * - `stop` is called when the last listener of a running subscription unsubscribes - it cancels the server side.
 * - `release` forgets the server side of a subscription the server ended, without telling the server.
 */
export const createOrpcSubscriptions = <Adapter extends OrpcSocketAdapterInstance, Transport>({
  bindings,
  serializer,
  start,
  stop,
  release,
}: {
  bindings: Pick<BindingsType<Adapter>, "onListen" | "onEvent" | "onError" | "onListenerStart" | "onListenerEnd">;
  serializer: OrpcSerializerType;
  start: (subscription: OrpcSubscriptionType<Transport>) => void;
  stop: (subscription: OrpcSubscriptionType<Transport>) => void;
  release: (subscription: OrpcSubscriptionType<Transport>) => void;
}) => {
  const { onListen, onEvent, onError, onListenerStart, onListenerEnd } = bindings;
  const subscriptions = new Map<string, OrpcSubscriptionType<Transport>>();

  const createError = (subscription: OrpcSubscriptionType<Transport>, cause: unknown) => {
    return new OrpcSocketError({ cause, topic: subscription.topic, payload: subscription.payload });
  };

  /**
   * Reports a failure of the subscription that does not end it, e.g. a dropped stream that starts again, as an
   * `OrpcSocketError`, so the user can tell which subscription failed
   */
  const report = (subscription: OrpcSubscriptionType<Transport>, cause: unknown) => {
    onError({ error: createError(subscription, cause) });
  };

  /** The server confirmed the subscription - after the first start and after every restart */
  const confirm = (subscription: OrpcSubscriptionType<Transport>) => {
    subscription.started = true;
    onListenerStart({ topic: subscription.topic, callbacks: subscription.callbacks });
  };

  /**
   * The server ended the subscription - finished it when `cause` is not set, failed it otherwise. The error is
   * reported to `onError` too. The listeners unsubscribe, and a later `listen()` starts a new subscription.
   */
  const end = (subscription: OrpcSubscriptionType<Transport>, cause?: unknown) => {
    release(subscription);
    subscription.started = false;
    subscriptions.delete(subscription.key);

    const error = cause === undefined ? null : createError(subscription, cause);
    if (error) {
      onError({ error });
    }
    onListenerEnd({ topic: subscription.topic, callbacks: new Set(subscription.callbacks), error });
  };

  const listen = (listener: ListenerOfAdapter<Adapter>, callback: ListenerCallbackType<Adapter, any>) => {
    const key = getOrpcSubscriptionKey(listener.topic, listener.payload, serializer);
    const subscription: OrpcSubscriptionType<Transport> = subscriptions.get(key) ?? {
      key,
      topic: listener.topic,
      payload: listener.payload,
      callbacks: new Set(),
      lastEventId: undefined,
      lastEventRetry: undefined,
      transport: undefined,
      started: false,
    };
    subscriptions.set(key, subscription);
    subscription.callbacks.add(callback);

    const removeListener = onListen({
      listener,
      callback,
      onUnmount: () => {
        subscription.callbacks.delete(callback);
        // An ended subscription is gone already, there is nothing to cancel on the server
        if (subscription.callbacks.size === 0 && subscriptions.get(key) === subscription) {
          subscriptions.delete(key);
          stop(subscription);
        }
      },
    });

    if (subscription.started) {
      // Joined a subscription the server confirmed already
      onListenerStart({ topic: subscription.topic, callbacks: new Set([callback]) });
    } else if (!subscription.transport) {
      start(subscription);
    }

    return removeListener;
  };

  /**
   * Applies an event of the server iterator to the subscription. `done` and `error` end the subscription, then it
   * returns `true`. Nothing here throws into the transport: errors of the server
   * and malformed data are reported as an `OrpcSocketError`, errors thrown by listener callbacks as they are.
   */
  const receive = (subscription: OrpcSubscriptionType<Transport>, { event, data, meta }: OrpcIteratorEventType) => {
    const id = typeof meta?.id === "string" ? meta.id : undefined;
    const retry = typeof meta?.retry === "number" ? meta.retry : undefined;
    // Errors carry the meta too, so a failed subscription resumes from the right place
    subscription.lastEventId = id ?? subscription.lastEventId;
    subscription.lastEventRetry = retry ?? subscription.lastEventRetry;

    // The value returned by the iterator is not delivered, listeners receive the yielded values
    if (event === "done") {
      end(subscription);
      return true;
    }

    let value: unknown;
    try {
      value = deserializeOrpcData(data, serializer);
    } catch (error) {
      if (event === "error") {
        end(subscription, error);
        return true;
      }
      report(subscription, error);
      return false;
    }

    if (event === "error") {
      // The same as the `RPCLink` of oRPC - an `ORPCError` when the data is one, the raw data otherwise
      end(subscription, isORPCErrorJson(value) ? createORPCErrorFromJson(value) : new ErrorEvent({ data: value }));
      return true;
    }

    // Every adapter of this package has the event meta as its extra type
    const extra = { id, retry } satisfies OrpcSocketExtraType as ExtractAdapterExtraType<Adapter>;
    try {
      onEvent({ topic: subscription.topic, data: value, extra, callbacks: subscription.callbacks });
    } catch (error) {
      onError({ error: toError(error) });
    }
    return false;
  };

  return {
    listen,
    receive,
    report,
    confirm,
    end,
    /** Every subscription with at least one listener */
    values: () => [...subscriptions.values()],
  };
};
