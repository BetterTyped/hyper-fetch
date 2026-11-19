/* eslint-disable max-params -- increment(match, field, by, options) is the public signature of the helper */
import type { ResponseSuccessType } from "adapter";
import type { OptimisticRollbackArgs, ParamType, RequestInstance } from "request";
import type {
  EmptyTypes,
  ExtractAdapterType,
  ExtractHasParamsType,
  ExtractParamsType,
  ExtractResponseType,
} from "types";

import type { OptimisticOperation } from "./optimistic";

// Keys

/** Keys of `T` holding numbers, the fields `increment` can change */
export type OptimisticNumberKeys<T> = {
  [K in keyof T]-?: NonNullable<T[K]> extends number ? K : never;
}[keyof T];

/** Keys of `T` holding arrays, the fields `.list()` can target */
export type OptimisticListKeys<T> = {
  [K in keyof T]-?: NonNullable<T[K]> extends readonly unknown[] ? K : never;
}[keyof T];

/** Item of the array held in the `K` field of `T` */
export type OptimisticListItem<T, K extends keyof T> = NonNullable<T[K]> extends readonly (infer Item)[] ? Item : never;

/** The key compared with a plain `match` value when no `key` is given */
export type OptimisticDefaultKey<Item> = "id" extends keyof Item ? "id" : never;

/**
 * Selects the list items a helper changes.
 * - A predicate: `(todo) => todo.id === todoId`
 * - A plain value compared with the item's `key` field (`id` by default). Numbers and strings match each other, so a
 *   route param `"1"` matches the id `1`.
 */
export type OptimisticMatchType<Item, Key extends keyof Item> =
  | ((item: Item) => boolean)
  | ([Key] extends [never] ? never : Item[Key] extends ParamType ? ParamType : Item[Key]);

export type OptimisticMatchOptionsType<Key> = {
  /** Field compared with a plain `match` value, `id` by default */
  key?: Key;
};

export type OptimisticInsertOptionsType = {
  /** Where the item goes: `"start"`, `"end"` (default) or an index */
  at?: "start" | "end" | number;
};

// Callbacks

/**
 * Argument of `.rollback()`.
 * - `data` - the target's data as it is now, after other mutations and server responses
 * - `previous` - the target's data just before this operation was applied, for looking up old values
 * - `reason` - why the change is reverted: `"error"`, `"abort"` or `"removed"` (from the queue)
 * - `response` / `request` - the mutation's failed response (absent for `"removed"`) and the mutation request
 */
export type OptimisticOperationRollbackArgs<Data, Mutation extends RequestInstance> = OptimisticRollbackArgs<Mutation> & {
  data: Data;
  previous: Data;
};

/**
 * Argument of `.commit()`.
 * - `data` - the target's data as it is now
 * - `response` / `request` - the mutation's successful response and the mutation request
 */
export type OptimisticOperationCommitArgs<Data, Mutation extends RequestInstance> = {
  data: Data;
  response: ResponseSuccessType<ExtractResponseType<Mutation>, ExtractAdapterType<Mutation>>;
  request: Mutation;
};

/*
 * The callbacks are declared as methods - their parameters stay bivariant, so an operation typed by a specific
 * mutation is accepted where the erased request type is expected (the request type depends on them through
 * `setOptimistic`).
 */

/**
 * Returns the new data of the target. Returning nothing leaves the data as it is. Must be synchronous.
 */
export type OptimisticOperationRollbackType<Data, Mutation extends RequestInstance> = {
  bivarianceHack(args: OptimisticOperationRollbackArgs<Data, Mutation>): Data | void;
}["bivarianceHack"];

/**
 * Returns the new data of the target. Returning nothing leaves the data as it is. Must be synchronous.
 */
export type OptimisticOperationCommitType<Data, Mutation extends RequestInstance> = {
  bivarianceHack(args: OptimisticOperationCommitArgs<Data, Mutation>): Data | void;
}["bivarianceHack"];

// Targets

type OptimisticTargetError = {
  "Target request needs params": "Call setParams() on the target before passing it to optimistic()";
};

type RequiresParams<Target> =
  ExtractHasParamsType<Target> extends true ? false : ExtractParamsType<Target> extends EmptyTypes ? false : true;

/** A target request, rejected at compile time while its endpoint params are not set */
export type OptimisticTargetRequestType<Target extends RequestInstance> = Target &
  (RequiresParams<Target> extends true ? OptimisticTargetError : unknown);

/** Helpers changing the items of a list - the target's data or an array field of it */
export type OptimisticListTargetType<Data, Item, Mutation extends RequestInstance> = {
  /** Merges `fields` into every matching item */
  patch: <Key extends keyof Item = OptimisticDefaultKey<Item>>(
    match: OptimisticMatchType<Item, Key>,
    fields: Partial<Item>,
    options?: OptimisticMatchOptionsType<Key>,
  ) => OptimisticOperation<Data, Mutation>;
  /** Adds the item, at the end unless `at` says otherwise */
  insert: (item: Item, options?: OptimisticInsertOptionsType) => OptimisticOperation<Data, Mutation>;
  /** Removes every matching item */
  remove: <Key extends keyof Item = OptimisticDefaultKey<Item>>(
    match: OptimisticMatchType<Item, Key>,
    options?: OptimisticMatchOptionsType<Key>,
  ) => OptimisticOperation<Data, Mutation>;
  /** Adds `by` to a number field of every matching item */
  increment: <Field extends OptimisticNumberKeys<Item>, Key extends keyof Item = OptimisticDefaultKey<Item>>(
    match: OptimisticMatchType<Item, Key>,
    field: Field,
    by: number,
    options?: OptimisticMatchOptionsType<Key>,
  ) => OptimisticOperation<Data, Mutation>;
};

/** Helpers changing a target whose data is an object */
export type OptimisticEntryTargetType<Data, Mutation extends RequestInstance> = {
  /** Adds `by` to a number field of the data */
  increment: <Field extends OptimisticNumberKeys<Data>>(field: Field, by: number) => OptimisticOperation<Data, Mutation>;
  /** Targets the array held in `field`, for the list helpers */
  list: <Field extends OptimisticListKeys<Data>>(
    field: Field,
  ) => OptimisticListTargetType<Data, OptimisticListItem<Data, Field>, Mutation>;
};

/**
 * Helpers available for a target. The list helpers exist when the target's data is an array; for a list inside an
 * object name it first with `.list("field")`.
 */
export type OptimisticTargetType<Data, Mutation extends RequestInstance> = {
  /** Replaces the data with the updater's result */
  set: (updater: (data: Data) => Data) => OptimisticOperation<Data, Mutation>;
} & (0 extends 1 & Data
  ? // Untyped data - every helper is available
    OptimisticListTargetType<Data, any, Mutation> & OptimisticEntryTargetType<Data, Mutation>
  : [Data] extends [readonly (infer Item)[]]
    ? OptimisticListTargetType<Data, Item, Mutation>
    : OptimisticEntryTargetType<Data, Mutation>);

/**
 * Builds optimistic operations. `optimistic(request)` changes the request's cache entry,
 * `optimistic.all(request)` every cached variant of it, whatever the query params (filters, infinite pages).
 */
export type OptimisticFactoryType<Mutation extends RequestInstance = RequestInstance> = {
  <Target extends RequestInstance>(
    target: OptimisticTargetRequestType<Target>,
  ): OptimisticTargetType<ExtractResponseType<Target>, Mutation>;
  all: <Target extends RequestInstance>(
    target: OptimisticTargetRequestType<Target>,
  ) => OptimisticTargetType<ExtractResponseType<Target>, Mutation>;
};

/** Operations returned from `setOptimistic` or passed with the `optimistic` send option */
export type OptimisticUpdatesType<Mutation extends RequestInstance = RequestInstance> = OptimisticOperation<
  any,
  Mutation
>[];
