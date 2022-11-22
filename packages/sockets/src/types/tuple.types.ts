export type TupleRestType<T> = T extends [first: any, ...rest: infer Rest] ? (Rest extends Array<any> ? Rest : []) : [];
