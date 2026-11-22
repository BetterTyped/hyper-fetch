/**
 * The [Standard Schema](https://standardschema.dev) interface. Zod, Valibot, ArkType and other libraries implement it,
 * so a collection accepts any of them without an adapter.
 */
export type StandardSchemaV1<Input = unknown, Output = Input> = {
  readonly "~standard": StandardSchemaV1Props<Input, Output>;
};

export type StandardSchemaV1Props<Input = unknown, Output = Input> = {
  readonly version: 1;
  readonly vendor: string;
  readonly validate: (value: unknown) => StandardSchemaV1Result<Output> | Promise<StandardSchemaV1Result<Output>>;
  readonly types?: { readonly input: Input; readonly output: Output } | undefined;
};

export type StandardSchemaV1Result<Output> =
  | { readonly value: Output; readonly issues?: undefined }
  | { readonly issues: readonly StandardSchemaV1Issue[] };

export type StandardSchemaV1Issue = {
  readonly message: string;
  readonly path?: readonly (PropertyKey | { readonly key: PropertyKey })[] | undefined;
};

/** The type a schema accepts */
export type InferSchemaInput<Schema extends StandardSchemaV1> = NonNullable<Schema["~standard"]["types"]>["input"];

/** The type a schema produces */
export type InferSchemaOutput<Schema extends StandardSchemaV1> = NonNullable<Schema["~standard"]["types"]>["output"];
