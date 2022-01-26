export type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[]
  ? ElementType
  : never;

export type RequiredKeys<T> = {
  [P in keyof T]-?: Required<T[P]>;
};
