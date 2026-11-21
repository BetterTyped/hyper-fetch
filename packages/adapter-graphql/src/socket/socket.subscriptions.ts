import type { ListenerCallbackType, SocketAdapterInstance } from "@hyper-fetch/sockets";
import type { GraphQLFormattedError } from "graphql";

import { getGqlOperationName, gqlEndpointMapper } from "../adapter/adapter.utils";
import type { GraphqlWsExtraType, GraphqlWsListenerOptionsType } from "./socket.types";
import { toError } from "./socket.utils";

type CallbackType = ListenerCallbackType<SocketAdapterInstance, any>;

/** One server subscription: a document with one set of variables, shared by every callback listening to it */
export type GraphqlSubscriptionType = {
  /** Topic, document and encoded variables - one server subscription per key */
  key: string;
  topic: string;
  /** Printed document, sent as `query` */
  query: string;
  operationName: string | undefined;
  /** Variables as the listener has them, sent with the subscription and passed to the callbacks in `extra` */
  payload: unknown;
  callbacks: Set<CallbackType>;
  /** The subscription was sent over the current acknowledged connection */
  started: boolean;
};

/** What the subscriptions need from the listener - the topic, the document and the variables */
type GraphqlListenerType = { topic: string; payload?: unknown; options?: GraphqlWsListenerOptionsType };

/** The adapter bindings used by the subscriptions */
type GraphqlBindingsType = {
  onListen: (options: {
    listener: GraphqlListenerType;
    callback: CallbackType;
    onUnmount?: VoidFunction;
  }) => () => void;
  onEvent: (options: {
    topic: string;
    data: unknown;
    extra: GraphqlWsExtraType;
    callbacks?: ReadonlySet<CallbackType>;
  }) => void;
  onError: (options: { error: Error }) => void;
  onListenerStart: (options: { topic: string; callbacks: ReadonlySet<CallbackType> }) => void;
  onListenerEnd: (options: { topic: string; callbacks: ReadonlySet<CallbackType>; error: Error | null }) => void;
};

/**
 * Keeps one server subscription per topic, document and variables. Callbacks with the same ones share it, the first
 * one starts it and the last one to leave stops it. The adapter only moves the subscriptions over its transport.
 */
export const createGraphqlSubscriptions = ({
  bindings: { onListen, onEvent, onError, onListenerStart, onListenerEnd },
  onStart,
  onStop,
}: {
  bindings: GraphqlBindingsType;
  /** The first callback joined - start the subscription when the connection is acknowledged */
  onStart: (subscription: GraphqlSubscriptionType) => void;
  /** The last callback left - stop the subscription on the server */
  onStop: (subscription: GraphqlSubscriptionType) => void;
}) => {
  const subscriptions = new Map<string, GraphqlSubscriptionType>();

  const leave = (subscription: GraphqlSubscriptionType, callback: CallbackType) => {
    if (!subscription.callbacks.delete(callback) || subscription.callbacks.size > 0) {
      return;
    }
    // A subscription ended by the server is not running anymore - its listeners leave on their own, nothing to stop
    if (subscriptions.get(subscription.key) === subscription) {
      subscriptions.delete(subscription.key);
      onStop(subscription);
    }
  };

  const listen = (listener: GraphqlListenerType, callback: CallbackType) => {
    const document = listener.options?.document ?? listener.topic;
    let query: string;
    let key: string;
    try {
      query = gqlEndpointMapper(document);
      // `undefined` variables are not sent - the subscription has none
      key = `${listener.topic}\n${query}\n${JSON.stringify(listener.payload) ?? ""}`;
    } catch (error) {
      // Nothing can be sent to the server - the callback is registered, so unsubscribing still works
      onError({ error: toError(error) });
      return onListen({ listener, callback });
    }

    const existing = subscriptions.get(key);
    const subscription: GraphqlSubscriptionType = existing ?? {
      key,
      topic: listener.topic,
      query,
      operationName: getGqlOperationName(document),
      payload: listener.payload,
      callbacks: new Set(),
      started: false,
    };
    subscription.callbacks.add(callback);

    const removeListener = onListen({ listener, callback, onUnmount: () => leave(subscription, callback) });

    if (!existing) {
      subscriptions.set(key, subscription);
      onStart(subscription);
    } else if (existing.started) {
      // Joined a subscription that is running already - only this callback has to hear about it
      onListenerStart({ topic: subscription.topic, callbacks: new Set([callback]) });
    }

    return removeListener;
  };

  /** Delivers an event to the callbacks of the subscription only */
  const deliver = (
    subscription: GraphqlSubscriptionType,
    { data, errors, extensions }: { data: unknown; errors: GraphQLFormattedError[] | undefined; extensions: unknown },
  ) => {
    const extra: GraphqlWsExtraType = {
      errors,
      extensions: (extensions as Record<string, unknown> | undefined) ?? {},
      payload: subscription.payload,
    };
    try {
      onEvent({ topic: subscription.topic, data, extra, callbacks: subscription.callbacks });
    } catch (error) {
      // A throwing callback must not break the transport, the other callbacks got the event already
      onError({ error: toError(error) });
    }
  };

  /** The subscription was sent over an acknowledged connection - after the first start and after every restart */
  const confirm = (subscription: GraphqlSubscriptionType) => {
    // eslint-disable-next-line no-param-reassign
    subscription.started = true;
    onListenerStart({ topic: subscription.topic, callbacks: subscription.callbacks });
  };

  /** The connection of the subscription dropped - it has to be sent again */
  const unconfirm = (subscription: GraphqlSubscriptionType) => {
    // eslint-disable-next-line no-param-reassign
    subscription.started = false;
  };

  /**
   * The server ended the subscription - it completed (`error: null`) or failed. Its listeners deliver what is pending
   * and unsubscribe, and a later `listen()` with the same variables starts a new subscription from scratch.
   */
  const end = (subscription: GraphqlSubscriptionType, error: Error | null) => {
    // Only running subscriptions can be ended, and a running one is always the subscription of its key.
    // It is removed first, so the listeners leaving below don't stop it again.
    subscriptions.delete(subscription.key);
    unconfirm(subscription);
    onListenerEnd({ topic: subscription.topic, callbacks: subscription.callbacks, error });
  };

  /** Subscriptions with at least one callback, the ones to start when the connection is acknowledged */
  const getAll = () => [...subscriptions.values()];

  return { listen, deliver, confirm, unconfirm, end, getAll };
};
