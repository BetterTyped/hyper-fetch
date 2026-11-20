type TrpcHasNoInput<Input> = [Input] extends [void | undefined] ? true : false;

/** Procedures without an input are sent without the payload */
export type TrpcProcedurePayload<Input> =
  TrpcHasNoInput<Input> extends true ? undefined : Exclude<Input, void | undefined>;

/** An optional input doesn't have to be set before sending the request or starting the subscription */
export type TrpcProcedureHasPayload<Input> =
  TrpcHasNoInput<Input> extends true ? false : undefined extends Input ? true : false;
