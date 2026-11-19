import type { RequestModel } from "@hyper-fetch/core";
import type {
  AnyTRPCProcedure,
  AnyTRPCRouter,
  TRPCRouterRecord,
  inferProcedureInput,
  inferTransformedProcedureOutput,
} from "@trpc/server";

type TrpcHasNoInput<Input> = [Input] extends [void | undefined] ? true : false;

/** Procedures without an input are sent without the payload */
type TrpcProcedurePayload<Input> = TrpcHasNoInput<Input> extends true ? undefined : Exclude<Input, void | undefined>;

/** An optional input doesn't have to be set before sending the request */
type TrpcProcedureHasPayload<Input> =
  TrpcHasNoInput<Input> extends true ? false : undefined extends Input ? true : false;

type TrpcProcedureModel<
  Router extends AnyTRPCRouter,
  Procedure extends AnyTRPCProcedure,
  Endpoint extends string,
> = RequestModel<{
  response: inferTransformedProcedureOutput<Router, Procedure>;
  payload: TrpcProcedurePayload<inferProcedureInput<Procedure>>;
  hasPayload: TrpcProcedureHasPayload<inferProcedureInput<Procedure>>;
  error: Router["_def"]["_config"]["$types"]["errorShape"];
  endpoint: Endpoint;
}>;

type TrpcProcedureSchema<
  Router extends AnyTRPCRouter,
  Procedure extends AnyTRPCProcedure,
  Endpoint extends string,
> = Procedure["_def"]["type"] extends "query"
  ? { $query: TrpcProcedureModel<Router, Procedure, Endpoint> }
  : { $mutation: TrpcProcedureModel<Router, Procedure, Endpoint> };

/** Subscriptions are not supported by the adapter, so they are not a part of the schema */
type TrpcSupportedKeys<Record extends TRPCRouterRecord> = {
  [Key in keyof Record]: Record[Key] extends AnyTRPCProcedure
    ? Record[Key]["_def"]["type"] extends "subscription"
      ? never
      : Key
    : Key;
}[keyof Record];

type TrpcRecordSchema<Router extends AnyTRPCRouter, Record extends TRPCRouterRecord, Path extends string> = {
  [Key in TrpcSupportedKeys<Record> & string]: Record[Key] extends AnyTRPCProcedure
    ? TrpcProcedureSchema<Router, Record[Key], `${Path}/${Key}`>
    : Record[Key] extends TRPCRouterRecord
      ? TrpcRecordSchema<Router, Record[Key], `${Path}/${Key}`>
      : never;
};

/**
 * Maps the type of a tRPC router to the schema understood by `createSdk`.
 *
 * @example
 * const api = createSdk<typeof client, TrpcSchema<AppRouter>>(client, { camelCaseToKebabCase: false });
 *
 * const { data } = await api.user.byId.$query.setPayload({ id: 1 }).send();
 */
export type TrpcSchema<Router extends AnyTRPCRouter> = TrpcRecordSchema<Router, Router["_def"]["record"], "">;
