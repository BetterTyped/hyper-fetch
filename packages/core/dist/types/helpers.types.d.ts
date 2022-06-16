export declare type NegativeTypes = null | undefined;
export declare type NullableType<T> = T | NegativeTypes;
export declare type NullableKeys<T> = {
    [P in keyof T]-?: NullableType<T[P]>;
};
export declare type NonNullableKeys<T> = {
    [P in keyof T]-?: NonNullable<T[P]>;
};
export declare type RequiredKeys<T> = {
    [P in keyof T]-?: Exclude<T[P], NegativeTypes>;
};
