/** Recursively optional version of a type, as streamed partial objects are. */
export type DeepPartial<T> = T extends (...args: any[]) => any
  ? T
  : T extends readonly (infer Item)[]
    ? DeepPartial<Item>[]
    : T extends object
      ? { [Key in keyof T]?: DeepPartial<T[Key]> }
      : T;

export type Prettify<T> = { [Key in keyof T]: T[Key] } & {};
