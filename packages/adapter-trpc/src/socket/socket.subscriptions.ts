import type { ListenerCallbackType, SocketAdapterInstance } from "@hyper-fetch/sockets";

import type { TrpcTransformerType } from "../adapter/adapter.types";
import { serializeTrpcInput, trpcEndpointMapper } from "../adapter/adapter.utils";
import type { TrpcSocketExtraType } from "./socket.types";
import { toError } from "./socket.utils";

type CallbackType = ListenerCallbackType<SocketAdapterInstance, any>;

/** One server subscription: a procedure called with one input, shared by every callback listening to it */
export type TrpcSubscriptionType = {
  /** Topic and encoded input - one server subscription per key */
  key: string;
  topic: string;
  /** Procedure path, `user.onUpdate` */
  path: string;
  /** Input as the listener has it, passed to the callbacks in `extra` */
  payload: unknown;
  /** Input after the transformer, as it is sent to the server */
  input: unknown;
  /** Encoded input, `undefined` when the procedure gets no input */
  encodedInput: string | undefined;
  callbacks: Set<CallbackType>;
  /** Id of the last `tracked()` event, sent back when the subscription is restarted */
  lastEventId: string | null;
  /** The server confirmed the subscription on the current transport */
  started: boolean;
};

/** What the subscriptions need from the listener - the topic and the procedure input */
type TrpcListenerType = { topic: string; payload?: unknown };

/** The adapter bindings used by the subscriptions, the same for both tRPC adapters */
type TrpcBindingsType = {
  onListen: (options: { listener: TrpcListenerType; callback: CallbackType; onUnmount?: VoidFunction }) => () => void;
  onEvent: (options: {
    topic: string;
    data: unknown;
    extra: TrpcSocketExtraType;
    callbacks?: ReadonlySet<CallbackType>;
  }) => void;
  onError: (options: { error: Error }) => void;
  onListenerStart: (options: { topic: string; callbacks: ReadonlySet<CallbackType> }) => void;
  onListenerEnd: (options: { topic: string; callbacks: ReadonlySet<CallbackType>; error: Error | null }) => void;
};

/**
 * Keeps one server subscription per topic and input. Callbacks with the same input share it, the first one starts it
 * and the last one to leave stops it. Adapters only move the subscriptions over their transport.
 */
export const createTrpcSubscriptions = ({
  bindings: { onListen, onEvent, onError, onListenerStart, onListenerEnd },
  transformer,
  onStart,
  onStop,
}: {
  bindings: TrpcBindingsType;
  transformer?: TrpcTransformerType;
  /** The first callback joined - start the subscription when the transport is ready */
  onStart: (subscription: TrpcSubscriptionType) => void;
  /** The last callback left - stop the subscription on the server */
  onStop: (subscription: TrpcSubscriptionType) => void;
}) => {
  const subscriptions = new Map<string, TrpcSubscriptionType>();

  const leave = (subscription: TrpcSubscriptionType, callback: CallbackType) => {
    if (!subscription.callbacks.delete(callback) || subscription.callbacks.size > 0) {
      return;
    }
    // A subscription ended by the server is not running anymore - its listeners leave on their own, nothing to stop
    if (subscriptions.get(subscription.key) === subscription) {
      subscriptions.delete(subscription.key);
      onStop(subscription);
    }
  };

  const listen = (listener: TrpcListenerType, callback: CallbackType) => {
    let input: unknown;
    let encodedInput: string | undefined;
    try {
      input = serializeTrpcInput(listener.payload, transformer);
      encodedInput = input === undefined ? undefined : JSON.stringify(input);
    } catch (error) {
      // Nothing can be sent to the server - the callback is registered, so unsubscribing still works
      onError({ error: toError(error) });
      return onListen({ listener, callback });
    }

    const key = getKey(listener.topic, encodedInput);

    const existing = subscriptions.get(key);
    const subscription: TrpcSubscriptionType = existing ?? {
      key,
      topic: listener.topic,
      path: trpcEndpointMapper(listener.topic),
      payload: listener.payload,
      input,
      encodedInput,
      callbacks: new Set(),
      lastEventId: null,
      started: false,
    };
    subscription.callbacks.add(callback);

    const removeListener = onListen({ listener, callback, onUnmount: () => leave(subscription, callback) });

    if (!existing) {
      subscriptions.set(key, subscription);
      onStart(subscription);
    } else if (existing.started) {
      // Joined a subscription the server confirmed already - only this callback has to hear about it
      onListenerStart({ topic: subscription.topic, callbacks: new Set([callback]) });
    }

    return removeListener;
  };

  /** Delivers an event to the callbacks of the subscription only */
  const deliver = (
    subscription: TrpcSubscriptionType,
    { data, eventId }: { data: unknown; eventId: string | null },
  ) => {
    if (eventId !== null) {
      // eslint-disable-next-line no-param-reassign
      subscription.lastEventId = eventId;
    }
    const extra: TrpcSocketExtraType = { eventId, payload: subscription.payload };
    try {
      onEvent({ topic: subscription.topic, data, extra, callbacks: subscription.callbacks });
    } catch (error) {
      // A throwing callback must not break the transport, the other callbacks got the event already
      onError({ error: toError(error) });
    }
  };

  /** The server confirmed the subscription - after the first start and after every restart */
  const confirm = (subscription: TrpcSubscriptionType) => {
    // eslint-disable-next-line no-param-reassign
    subscription.started = true;
    onListenerStart({ topic: subscription.topic, callbacks: subscription.callbacks });
  };

  /** The transport of the subscription dropped or is restarted - it has to be confirmed again */
  const unconfirm = (subscription: TrpcSubscriptionType) => {
    // eslint-disable-next-line no-param-reassign
    subscription.started = false;
  };

  /**
   * The server ended the subscription - it finished (`error: null`) or failed. Its listeners deliver what is pending
   * and unsubscribe, and a later `listen()` with the same input starts a new subscription from scratch.
   */
  const end = (subscription: TrpcSubscriptionType, error: Error | null) => {
    // Only running subscriptions can be ended, and a running one is always the subscription of its key.
    // It is removed first, so the listeners leaving below don't stop it again.
    subscriptions.delete(subscription.key);
    unconfirm(subscription);
    onListenerEnd({ topic: subscription.topic, callbacks: subscription.callbacks, error });
  };

  /** Subscriptions with at least one callback, the ones to start when the transport connects */
  const getAll = () => [...subscriptions.values()];

  return { listen, deliver, confirm, unconfirm, end, getAll };
};

const getKey = (topic: string, encodedInput: string | undefined) => `${topic}\n${encodedInput ?? ""}`;
