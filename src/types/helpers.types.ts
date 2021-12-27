export type NegativeTypes = null | undefined;

export type NullableType<T> = T | NegativeTypes;

export type NonNullableKeys<T> = {
  [P in keyof T]-?: NonNullable<T[P]>;
};

export type RequiredKeys<T> = {
  [P in keyof T]-?: Required<T[P]>;
};
