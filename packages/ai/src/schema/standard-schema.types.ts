/**
 * The Standard Schema interface (https://standardschema.dev), implemented by Zod, Valibot, ArkType, Effect Schema and
 * others. It is copied here as types only, as recommended by the spec, so no schema library is a dependency.
 */
export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly "~standard": StandardSchemaV1.Props<Input, Output>;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace StandardSchemaV1 {
  export interface Props<Input = unknown, Output = Input> {
    readonly version: 1;
    readonly vendor: string;
    readonly validate: (value: unknown) => Result<Output> | Promise<Result<Output>>;
    readonly types?: Types<Input, Output> | undefined;
  }

  export type Result<Output> = SuccessResult<Output> | FailureResult;

  export interface SuccessResult<Output> {
    readonly value: Output;
    readonly issues?: undefined;
  }

  export interface FailureResult {
    readonly issues: readonly Issue[];
  }

  export interface Issue {
    readonly message: string;
    readonly path?: readonly (PropertyKey | PathSegment)[] | undefined;
  }

  export interface PathSegment {
    readonly key: PropertyKey;
  }

  export interface Types<Input = unknown, Output = Input> {
    readonly input: Input;
    readonly output: Output;
  }

  export type InferInput<Schema extends StandardSchemaV1> = NonNullable<Schema["~standard"]["types"]>["input"];
  export type InferOutput<Schema extends StandardSchemaV1> = NonNullable<Schema["~standard"]["types"]>["output"];
}

/**
 * Optional JSON Schema conversion from the Standard JSON Schema proposal, implemented by e.g. Zod 4.2+. Used to
 * describe client-side tools to AG-UI backends without asking for a hand-written JSON Schema.
 */
export type StandardJSONSchemaSourceType = {
  readonly "~standard": {
    readonly jsonSchema?: {
      readonly input?: (options: { target: string }) => Record<string, unknown>;
    };
  };
};

export type JSONSchemaType = Record<string, unknown>;

/** Output type of a Standard Schema */
export type InferSchemaOutput<Schema> = Schema extends StandardSchemaV1<any, infer Output> ? Output : unknown;
/** Input type of a Standard Schema */
export type InferSchemaInput<Schema> = Schema extends StandardSchemaV1<infer Input, any> ? Input : unknown;
