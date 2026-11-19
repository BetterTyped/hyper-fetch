import type { RequestModel } from "@hyper-fetch/core";
import type { Client, NestedClient, ORPCError } from "@orpc/client";
import type { AnyRouter, RouterClient } from "@orpc/server";

import type { OrpcErrorType } from "./adapter.types";

type OrpcHasNoInput<Input> = unknown extends Input ? true : [Input] extends [void | undefined] ? true : false;

/** Procedures without an input are sent without the payload */
type OrpcProcedurePayload<Input> = OrpcHasNoInput<Input> extends true ? undefined : Exclude<Input, void | undefined>;

/** An optional input doesn't have to be set before sending the request */
type OrpcProcedureHasPayload<Input> =
  OrpcHasNoInput<Input> extends true ? false : undefined extends Input ? true : false;

/** Errors from the `.errors()` map keep their code and data, any other error is not defined by the procedure */
type OrpcProcedureError<Error> =
  | (Error extends ORPCError<infer Code, infer Data> ? OrpcErrorType<Code, Data> & { defined: true } : never)
  | (OrpcErrorType & { defined: false });

type OrpcProcedureModel<Input, Output, Error, Endpoint extends string> = RequestModel<{
  response: Output;
  payload: OrpcProcedurePayload<Input>;
  hasPayload: OrpcProcedureHasPayload<Input>;
  error: OrpcProcedureError<Error>;
  endpoint: Endpoint;
}>;

/** Every procedure can be read with `$query` and changed with `$mutation`, the same as in the oRPC query utils */
type OrpcProcedureSchema<Input, Output, Error, Endpoint extends string> = {
  $query: OrpcProcedureModel<Input, Output, Error, Endpoint>;
  $mutation: OrpcProcedureModel<Input, Output, Error, Endpoint>;
};

type OrpcAnyClient = Client<any, any, any, any>;

/** Event iterators are not supported by the adapter, so they are not a part of the schema. Procedures that only throw stay. */
type OrpcSupportedKeys<Record> = {
  [Key in keyof Record]: Record[Key] extends Client<any, any, infer Output, any>
    ? [Output] extends [never]
      ? Key
      : [Output] extends [{ [Symbol.asyncIterator]: unknown }]
        ? never
        : Key
    : Key;
}[keyof Record];

type OrpcClientSchema<Record, Path extends string> = {
  [Key in OrpcSupportedKeys<Record> & string]: Record[Key] extends Client<any, infer Input, infer Output, infer Error>
    ? OrpcProcedureSchema<Input, Output, Error, `${Path}/${Key}`>
    : Record[Key] extends NestedClient<any>
      ? OrpcClientSchema<Record[Key], `${Path}/${Key}`>
      : never;
};

type OrpcRouterClient<Router> = Router extends OrpcAnyClient
  ? never
  : Router extends NestedClient<any>
    ? Router
    : Router extends AnyRouter
      ? RouterClient<Router>
      : never;

/**
 * Maps the type of an oRPC router to the schema understood by `createSdk`.
 * It takes the router, or the client type, like `ContractRouterClient<typeof contract>` for contract-first APIs.
 *
 * @example
 * const api = createSdk<typeof client, OrpcSchema<typeof router>>(client, { camelCaseToKebabCase: false });
 *
 * const { data } = await api.planet.find.$query.setPayload({ id: 1 }).send();
 */
export type OrpcSchema<Router extends AnyRouter | NestedClient<any>> = OrpcClientSchema<OrpcRouterClient<Router>, "">;
