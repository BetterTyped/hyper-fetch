/* eslint-disable max-params -- increment(match, field, by, options) is the public signature of the helper */
import type { RequestInstance } from "request";

import type {
  OptimisticFactoryType,
  OptimisticInsertOptionsType,
  OptimisticMatchOptionsType,
  OptimisticOperationCommitType,
  OptimisticOperationRollbackType,
} from "./optimistic.types";
import type { OptimisticMatcher } from "./optimistic.utils";
import {
  incrementField,
  incrementItems,
  insertItem,
  patchItems,
  removeItems,
  updateListField,
} from "./optimistic.utils";

/**
 * Callbacks are stored with an erased mutation type - the mutation type is only checked where they are passed in,
 * which keeps operations of a specific mutation assignable to the erased one.
 */
type OptimisticOperationOptions<Data> = {
  target: RequestInstance;
  allVariants: boolean;
  update: (data: Data) => Data;
  onRollback?: OptimisticOperationRollbackType<Data, RequestInstance>;
  onCommit?: OptimisticOperationCommitType<Data, RequestInstance>;
};

/**
 * One change of one target, built with `optimistic(target)`. Core applies it before the mutation is sent, and runs its
 * `.commit()` on success or its `.rollback()` when the mutation fails, is aborted or removed from the queue.
 * Operations are immutable - `.rollback()` and `.commit()` return a new operation, so one can be reused.
 */
export class OptimisticOperation<Data, Mutation extends RequestInstance = RequestInstance> {
  /** @internal */
  readonly target: RequestInstance;
  /** @internal */
  readonly allVariants: boolean;
  /** @internal */
  readonly update: (data: Data) => Data;
  /** @internal */
  readonly onRollback?: OptimisticOperationRollbackType<Data, RequestInstance> = undefined;
  /** @internal */
  readonly onCommit?: OptimisticOperationCommitType<Data, RequestInstance> = undefined;

  constructor(options: OptimisticOperationOptions<Data>) {
    this.target = options.target;
    this.allVariants = options.allVariants;
    this.update = options.update;
    this.onRollback = options.onRollback;
    this.onCommit = options.onCommit;
  }

  /**
   * Undo of this change, written by hand and run by core when the mutation fails for good, is aborted or removed from
   * the queue. Rollbacks of one mutation run in reverse order of the changes. It receives
   * `{ data, previous, reason, response, request }` and returns the new data; returning nothing leaves the data as it
   * is. Build the result from `data` and use `previous` only to look old values up. Must be synchronous.
   * Without it nothing is undone locally and the target is refetched.
   */
  // Method syntax keeps the mutation type bivariant, so operations typed by a mutation fit erased requests
  rollback(callback: OptimisticOperationRollbackType<Data, Mutation>): OptimisticOperation<Data, Mutation> {
    return new OptimisticOperation({
      target: this.target,
      allVariants: this.allVariants,
      update: this.update,
      onRollback: callback as OptimisticOperationRollbackType<Data, RequestInstance>,
      onCommit: this.onCommit,
    });
  }

  /**
   * Runs when the mutation succeeds, before the target is refreshed. It receives `{ data, response, request }` and
   * returns the new data, for example to swap a temporary item for the one from the response. Returning nothing leaves
   * the data as it is. Must be synchronous.
   */
  commit(callback: OptimisticOperationCommitType<Data, Mutation>): OptimisticOperation<Data, Mutation> {
    return new OptimisticOperation({
      target: this.target,
      allVariants: this.allVariants,
      update: this.update,
      onRollback: this.onRollback,
      onCommit: callback as OptimisticOperationCommitType<Data, RequestInstance>,
    });
  }
}

type ListUpdate = (list: unknown[]) => unknown[];

const createTarget = (target: RequestInstance, allVariants: boolean) => {
  const operation = (update: (data: unknown) => unknown) => {
    return new OptimisticOperation<unknown>({ target, allVariants, update });
  };

  const createListHelpers = (onList: (update: ListUpdate) => (data: unknown) => unknown) => ({
    patch: (match: OptimisticMatcher, fields: object, options?: OptimisticMatchOptionsType<PropertyKey>) => {
      return operation(onList((list) => patchItems(list, { match, key: options?.key }, fields)));
    },
    insert: (item: unknown, options?: OptimisticInsertOptionsType) => {
      return operation(onList((list) => insertItem(list, item, options)));
    },
    remove: (match: OptimisticMatcher, options?: OptimisticMatchOptionsType<PropertyKey>) => {
      return operation(onList((list) => removeItems(list, { match, key: options?.key })));
    },
    increment: (
      match: OptimisticMatcher,
      field: PropertyKey,
      by: number,
      options?: OptimisticMatchOptionsType<PropertyKey>,
    ) => {
      return operation(onList((list) => incrementItems(list, { match, key: options?.key }, { field, by })));
    },
  });

  // The target's data is the list itself
  const listHelpers = createListHelpers((update) => (data) => update(data as unknown[]));

  return {
    ...listHelpers,
    set: (updater: (data: unknown) => unknown) => operation(updater),
    // `increment(field, by)` changes the data, `increment(match, field, by)` the matching list items
    increment: (...args: [PropertyKey, number] | [OptimisticMatcher, PropertyKey, number, object?]) => {
      if (args.length >= 3) {
        const [match, field, by, options] = args as [OptimisticMatcher, PropertyKey, number, object?];
        return listHelpers.increment(match, field, by, options);
      }
      const [field, by] = args as [PropertyKey, number];
      return operation((data) => incrementField(data, field, by));
    },
    list: (field: PropertyKey) => {
      return createListHelpers((update) => (data) => updateListField(data, field, update));
    },
  };
};

const optimisticFactory = (target: RequestInstance) => createTarget(target, false);
optimisticFactory.all = (target: RequestInstance) => createTarget(target, true);

/**
 * Describes an optimistic change of a cached request. Return the operations from `setOptimistic` or pass them with the
 * `optimistic` send option, core applies them, runs `.commit()` / `.rollback()` when the mutation settles and refreshes
 * the targets once the last pending mutation on them is done.
 *
 * - `optimistic(getTodos)` - the entry of this request (its params and query params)
 * - `optimistic.all(getTodos)` - every cached variant of it, whatever the query params (filters, infinite pages)
 *
 * Helpers: `set(updater)`, `patch(match, fields)`, `insert(item, { at })`, `remove(match)`,
 * `increment(field, by)` / `increment(match, field, by)` and `.list("field")` for an array inside an object.
 *
 * @example
 * optimistic(getTodos)
 *   .patch(params.todoId, payload)
 *   .rollback(({ data, previous }) => {
 *     const before = previous.find((todo) => todo.id === params.todoId);
 *     return data.map((todo) => (todo.id === params.todoId && before ? before : todo));
 *   });
 */
export const optimistic = optimisticFactory as unknown as OptimisticFactoryType;
