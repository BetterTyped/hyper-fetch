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
> = Key extends keyof Types ? Types[Key] : Value;

export type SyncOrAsync<T> = T | Promise<T>;
