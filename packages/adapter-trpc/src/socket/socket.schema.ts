import type { ListenerModel } from "@hyper-fetch/sockets";
import type {
  AnyTRPCProcedure,
  AnyTRPCRouter,
  TRPCRouterRecord,
  TrackedEnvelope,
  inferProcedureInput,
  inferTransformedProcedureOutput,
} from "@trpc/server";

import type { TrpcProcedureHasPayload, TrpcProcedurePayload } from "../adapter/adapter.schema.utils";

/** Async generator subscriptions emit what they yield, observable subscriptions what they emit */
type TrpcSubscriptionYield<Output> = Output extends AsyncIterable<infer Value> ? Value : Output;

/**
 * Events yielded with `tracked(id, data)` reach the listeners as `data`, the id goes to `extra.eventId`.
 * tRPC types them as `{ id: string; data }`, so an object with exactly these keys is unwrapped as well.
 */
type TrpcUntrackedEvent<Event> =
  Event extends TrackedEnvelope<infer Data>
    ? Data
    : Event extends { id: string; data: infer Data }
      ? [Exclude<keyof Event, "id" | "data">] extends [never]
        ? Data
        : Event
      : Event;

type TrpcSubscriptionModel<
  Router extends AnyTRPCRouter,
  Procedure extends AnyTRPCProcedure,
  Topic extends string,
> = ListenerModel<{
  response: TrpcUntrackedEvent<TrpcSubscriptionYield<inferTransformedProcedureOutput<Router, Procedure>>>;
  payload: TrpcProcedurePayload<inferProcedureInput<Procedure>>;
  hasPayload: TrpcProcedureHasPayload<inferProcedureInput<Procedure>>;
  topic: Topic;
}>;

/** Only subscriptions can be listened to, queries and mutations are left out */
type TrpcSubscriptionKeys<Record extends TRPCRouterRecord> = {
  [Key in keyof Record]: Record[Key] extends AnyTRPCProcedure
    ? Record[Key]["_def"]["type"] extends "subscription"
      ? Key
      : never
    : Key;
}[keyof Record];

type TrpcTopic<Path extends string, Key extends string> = Path extends "" ? Key : `${Path}/${Key}`;

type TrpcSocketRecordSchema<Router extends AnyTRPCRouter, Record extends TRPCRouterRecord, Path extends string> = {
  [Key in TrpcSubscriptionKeys<Record> & string]: Record[Key] extends AnyTRPCProcedure
    ? { $listener: TrpcSubscriptionModel<Router, Record[Key], TrpcTopic<Path, Key>> }
    : Record[Key] extends TRPCRouterRecord
      ? TrpcSocketRecordSchema<Router, Record[Key], TrpcTopic<Path, Key>>
      : never;
};

/**
 * Maps the subscriptions of a tRPC router to the schema understood by `createSocketSdk`. Every subscription becomes
 * a `$listener` whose payload is the procedure input and whose response is the event it yields, without the
 * `tracked()` wrapper. Queries and mutations are left out, they are sent with the `TrpcAdapter`.
 *
 * @example
 * const socket = new Socket({ url: "ws://localhost:3001", adapter: TrpcWebsocketAdapter() });
 * const api = createSocketSdk<typeof socket, TrpcSocketSchema<AppRouter>>(socket, { camelCaseToKebabCase: false });
 *
 * api.user.onUpdate.$listener.setPayload({ id: 1 }).listen(({ data }) => {});
 */
export type TrpcSocketSchema<Router extends AnyTRPCRouter> = TrpcSocketRecordSchema<
  Router,
  Router["_def"]["record"],
  ""
>;
