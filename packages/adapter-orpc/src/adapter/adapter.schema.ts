import type { RequestModel } from "@hyper-fetch/core";
import type { ListenerModel } from "@hyper-fetch/sockets";
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

/** The yielded value of an event iterator output, `never` for any other output */
type OrpcIteratorValue<Output> = [Output] extends [never]
  ? never
  : [Output] extends [AsyncIterator<infer Value, any, any>]
    ? Value
    : never;

type OrpcTopic<Path extends string, Key extends string> = Path extends "" ? Key : `${Path}/${Key}`;

type OrpcListenerModel<Input, Output, Topic extends string> = ListenerModel<{
  response: OrpcIteratorValue<Output>;
  payload: OrpcProcedurePayload<Input>;
  hasPayload: OrpcProcedureHasPayload<Input>;
  topic: Topic;
}>;

/** `true` for an event iterator procedure, and for a nested router with at least one of them */
type OrpcHasIterator<Value> =
  Value extends Client<any, any, infer Output, any>
    ? [OrpcIteratorValue<Output>] extends [never]
      ? false
      : true
    : Value extends NestedClient<any>
      ? true extends { [Key in keyof Value]: OrpcHasIterator<Value[Key]> }[keyof Value]
        ? true
        : false
      : false;

type OrpcSocketClientSchema<Record, Path extends string> = {
  [Key in keyof Record & string as OrpcHasIterator<Record[Key]> extends true ? Key : never]: Record[Key] extends Client<
    any,
    infer Input,
    infer Output,
    any
  >
    ? { $listener: OrpcListenerModel<Input, Output, OrpcTopic<Path, Key>> }
    : OrpcSocketClientSchema<Record[Key], OrpcTopic<Path, Key>>;
};

/**
 * Maps the type of an oRPC router to the schema understood by `createSocketSdk`. Every event iterator procedure
 * becomes a `$listener` - the response is the yielded value, the payload is the input and the topic is the
 * procedure path. Other procedures are not a part of it, call them with `OrpcSchema` and `OrpcAdapter`.
 * It takes the router, or the client type, like `ContractRouterClient<typeof contract>` for contract-first APIs.
 *
 * @example
 * const socket = new Socket({ url: "http://localhost:3000/rpc", adapter: OrpcStreamAdapter() });
 * const sdk = createSocketSdk<typeof socket, OrpcSocketSchema<typeof router>>(socket, { camelCaseToKebabCase: false });
 *
 * sdk.planet.onUpdate.$listener.setPayload({ id: 1 }).listen(({ data }) => console.log(data));
 */
export type OrpcSocketSchema<Router extends AnyRouter | NestedClient<any>> = OrpcSocketClientSchema<
  OrpcRouterClient<Router>,
  ""
>;
