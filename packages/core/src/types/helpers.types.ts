export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

// DO NOT ADD `void` to this type, it will break the type generation
export type EmptyTypes = null | undefined;

export type NullableType<T> = T | EmptyTypes;

export type NullableKeys<T> = {
  [P in keyof T]-?: NullableType<T[P]>;
};

export type NonNullableKeys<T> = {
  [P in keyof T]-?: NonNullable<T[P]>;
};

export type RequiredKeys<T> = {
  [P in keyof T]-?: Exclude<T[P], EmptyTypes>;
};

export type TypeWithDefaults<
  Types extends Record<string, any>,
  Key extends keyof Types,
  Value,
  ExcludedTypes = void | never,
> = Key extends keyof Types
  ? Exclude<Types[Key], ExcludedTypes> extends never
    ? Value
    : Exclude<Types[Key], ExcludedTypes>
  : Value;

export type SyncOrAsync<T> = T | Promise<T>;
