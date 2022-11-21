export type TupleRestType<T> = T extends [first: any, ...rest: infer Rest] ? Rest : never;
