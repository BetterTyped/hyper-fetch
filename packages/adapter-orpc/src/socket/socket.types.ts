import type { ListenerCallbackType, SocketAdapter } from "@hyper-fetch/sockets";
import type { StandardRPCCustomJsonSerializer } from "@orpc/client/standard";

/**
 * Meta of the event, passed to the listeners as `extra`.
 * The server sets it with `withEventMeta(value, { id, retry })`.
 */
export type OrpcSocketExtraType = {
  /** Id of the event. It is sent back as `last-event-id` when the subscription starts again, so the server can resume */
  id: string | undefined;
  /** Delay in milliseconds the server asks for before the subscription starts again after a failure */
  retry: number | undefined;
};

/** Options of the `OrpcStreamAdapter` and `OrpcWebsocketAdapter` factories */
export type OrpcSocketAdapterConfigType = {
  /**
   * Serializers of custom types, the same as the `customJsonSerializers` option of `RPCHandler` and `RPCLink`.
   * Both sides need the same list.
   */
  customJsonSerializers?: StandardRPCCustomJsonSerializer[];
};

/** Any socket adapter of this package, the listeners receive the event meta as `extra` */
export type OrpcSocketAdapterInstance = SocketAdapter<OrpcSocketExtraType, any, any, any, any, any>;

/** An event of the server event iterator, with the data still in the serialized `{ json, meta }` form */
export type OrpcIteratorEventType = {
  event: "message" | "error" | "done";
  data: unknown;
  meta: { id?: unknown; retry?: unknown } | undefined;
};

/**
 * One server subscription - the procedure called with one input. Every listener with the same topic and payload
 * shares it. `transport` holds the adapter state of the running server side, it is empty when nothing runs.
 * Once the server ends it, the subscription is gone - a later `listen()` creates a new one.
 */
export type OrpcSubscriptionType<Transport> = {
  key: string;
  topic: string;
  payload: unknown;
  callbacks: Set<ListenerCallbackType<any, any>>;
  /** Id of the last event, sent as `last-event-id` when the subscription starts again */
  lastEventId: string | undefined;
  /** Retry delay of the last event */
  lastEventRetry: number | undefined;
  transport: Transport | undefined;
  /** `true` once the server confirmed the running server side, reset when it starts again */
  started: boolean;
};

/** Details of the subscription an `OrpcSocketError` belongs to */
export type OrpcSocketErrorOptionsType = {
  /**
   * What went wrong - the `ORPCError` the server sent, the `ErrorEvent` of an error event without the oRPC shape,
   * or the error of the transport or the decoding.
   */
  cause: unknown;
  /** Topic of the failed subscription, `null` when the message can't be matched to a subscription */
  topic: string | null;
  /** Input of the failed subscription */
  payload: unknown;
};
