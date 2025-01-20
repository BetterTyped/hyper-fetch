export type NegativeTypes = null | undefined;

export type NullableType<T> = T | NegativeTypes;

export type NullableKeys<T> = {
  [P in keyof T]-?: NullableType<T[P]>;
};

export type NonNullableKeys<T> = {
  [P in keyof T]-?: NonNullable<T[P]>;
};

export type RequiredKeys<T> = {
  [P in keyof T]-?: Exclude<T[P], NegativeTypes>;
};

export type TypeWithDefaults<
  Types extends Record<string, any>,
  Key extends keyof Types,
  Value,
> = Key extends keyof Types ? Types[Key] : Value;

export type SyncOrAsync<T> = T | Promise<T>;
