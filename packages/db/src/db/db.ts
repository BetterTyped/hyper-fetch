import type { CollectionInstance } from "../collection/collection";
import type {
  KeyFieldOf,
  LoaderDescriptor,
  MutationDescriptor,
  RowKey,
  SortDirection,
} from "../collection/collection.types";
import type { Transaction } from "../mutation/mutation";
import { createTransaction } from "../mutation/mutation";
import type {
  Condition,
  ExtractConditionEq,
  ExtractConditionTokens,
  FieldRef,
  RowRefs,
} from "../operators/operators.types";
import { Query } from "../query/query";
import type { JoinSpec, JoinTarget, JoinedMatchOf } from "../query/query";
import type { Row as StoreRow } from "../store/store.types";
import { createId } from "../utils/request.utils";
import type { CollectionRuntime } from "./collection.runtime";
import { DbRuntime } from "./db.runtime";
import type {
  DbErrorEvent,
  DbInspection,
  DbOptions,
  DehydratedDb,
  MutationOperation,
  TransactionConfig,
} from "./db.types";

export type WriteOptions = {
  /** Writes this one is built on. When one of them is rejected, this write is dropped too. */
  dependsOn?: readonly (Transaction | string)[];
};

type InsertMethod<Mutations> = Mutations extends { insert: infer Input }
  ? (row: Input, options?: WriteOptions) => Transaction
  : never;

type UpdateMethod<Key, Mutations> = Mutations extends { update: infer Changes }
  ? (key: Key, changes: Changes, options?: WriteOptions) => Transaction
  : never;

type DeleteMethod<Key, Mutations> = Mutations extends { delete: true }
  ? (key: Key, options?: WriteOptions) => Transaction
  : never;

const TEMPORARY_KEY_PREFIX = "tmp:";

/** A collection inside a db: queries start here, and writes go through it */
export class CollectionHandle<
  Row,
  Input,
  KeyField extends KeyFieldOf<Row>,
  Loaders extends LoaderDescriptor,
  Mutations extends MutationDescriptor,
> {
  /** Type-only carrier of the handle's generics, never set at runtime */
  declare readonly __types?: { row: Row; input: Input; key: KeyField; loaders: Loaders; mutations: Mutations };

  /** The collection's name in `createDb` */
  readonly collectionName: string;

  /** Adds an optimistic insert and sends it. A row without a key gets a temporary one until the server assigns it. */
  readonly insert: InsertMethod<Mutations>;
  /** Adds an optimistic update and sends it */
  readonly update: UpdateMethod<NonNullable<Row[KeyField]>, Mutations>;
  /** Adds an optimistic delete and sends it */
  readonly delete: DeleteMethod<NonNullable<Row[KeyField]>, Mutations>;

  constructor(
    private readonly runtime: DbRuntime,
    private readonly name: string,
  ) {
    this.collectionName = name;
    this.insert = ((row: StoreRow, options?: WriteOptions) =>
      this.write({ op: "insert", key: undefined, input: row, options })) as never;
    this.update = ((key: RowKey, changes: StoreRow, options?: WriteOptions) =>
      this.write({ op: "update", key, input: changes, options })) as never;
    this.delete = ((key: RowKey, options?: WriteOptions) =>
      this.write({ op: "delete", key, input: {}, options })) as never;
  }

  where<C extends Condition<string, string>>(callback: (row: RowRefs<Row>) => C) {
    return this.start().where(callback) as Query<Row, Loaders, Row, ExtractConditionTokens<C>, ExtractConditionEq<C>>;
  }

  orderBy<Name extends keyof Row & string>(
    callback: (row: RowRefs<Row>) => FieldRef<Name, Row[Name]>,
    direction?: SortDirection,
  ) {
    return this.start().orderBy(callback, direction);
  }

  select<Selection extends Record<string, FieldRef<string, unknown>>>(callback: (row: RowRefs<Row>) => Selection) {
    return this.start().select(callback);
  }

  limit(limit: number) {
    return this.start().limit(limit);
  }

  /** Adds the row of another collection whose key is the given field. See `Query.join`. */
  join<Name extends string, Target extends JoinTarget, Field extends keyof Row & string, const On, const Type>(
    name: Name,
    collection: Target,
    by: JoinSpec<Row, Field, JoinedMatchOf<Target, On>, On, Type>,
  ) {
    return this.start().join(name, collection, by);
  }

  /** Reads only the rows the db holds and never sends a request */
  local() {
    return this.start().local();
  }

  /** Reads one row by key */
  findOne(key: NonNullable<Row[KeyField]>): Query<Row, Loaders, Row, never, never, never, "one"> {
    return new Query(this.runtime, { collection: this.name, orderBy: [], local: false, one: { key: key as RowKey } });
  }

  /** The key to render a row with. It stays the same when a temporary key is swapped for the server's. */
  renderKey(key: NonNullable<Row[KeyField]>): string {
    return this.getRuntime().getRenderKey(key as RowKey);
  }

  private start() {
    return new Query<Row, Loaders, Row>(this.runtime, { collection: this.name, orderBy: [], local: false });
  }

  private getRuntime() {
    return this.runtime.collections.get(this.name)!;
  }

  private write({
    op,
    key: givenKey,
    input,
    options,
  }: {
    op: MutationOperation;
    key: RowKey | undefined;
    input: StoreRow;
    options: WriteOptions | undefined;
  }) {
    const collection = this.getRuntime();
    const { mutations } = this.runtime;
    // A temporary key the server replaced still names the row, so writes made with it reach the server's key
    const key = givenKey === undefined ? undefined : collection.resolveKey(givenKey);
    const dependsOn = (options?.dependsOn ?? []).map((item) => (typeof item === "string" ? item : item.id));
    const { key: keyField } = collection.config;

    const id = createId();
    const submit = (values: StoreRow) => {
      if (op !== "insert") {
        return mutations.submit({ collection, op, key: key!, values, dependsOn, id });
      }
      const rowKey = values[keyField] as RowKey | undefined;
      if (rowKey !== undefined && rowKey !== null) {
        return mutations.submit({ collection, op, key: rowKey, values, dependsOn, id });
      }
      const insertRequest = collection.config.mutations.insert?.request;
      if (mutations.usesOutbox && insertRequest && !insertRequest.client.appManager.isOnline) {
        return mutations.reject(new Error("An insert that leaves the key to the server cannot be made offline"), id);
      }
      const temporaryKey = `${TEMPORARY_KEY_PREFIX}${id}`;
      return mutations.submit({
        collection,
        op,
        key: temporaryKey,
        values: { ...values, [keyField]: temporaryKey },
        dependsOn,
        id,
        temporaryKey: true,
      });
    };

    const mistake = findWriteMistake({ collection, op, key, input });
    if (mistake) {
      this.runtime.emitError({ type: "mutation", error: mistake, collection: this.name });
      return mutations.reject(mistake, id);
    }
    const prepared = prepareWrite({ collection, op, key, input });
    const finish = (result: PreparedValues) => {
      if ("issues" in result) {
        this.runtime.emitError({ type: "validation", error: result.issues, collection: this.name });
        return mutations.reject(result.issues, id);
      }
      return submit(result.values);
    };
    if (prepared instanceof Promise) {
      return createTransaction(id, prepared.then(finish));
    }
    return finish(prepared);
  }
}

type PreparedValues = { values: StoreRow } | { issues: unknown };

/** A write that cannot be right whatever the server says: an insert of a key the db holds, or an update of the key */
const findWriteMistake = ({
  collection,
  op,
  key,
  input,
}: {
  collection: CollectionRuntime;
  op: MutationOperation;
  key: RowKey | undefined;
  input: StoreRow;
}): Error | undefined => {
  const keyField = collection.config.key;
  const insertedKey = input[keyField] as RowKey | undefined;
  if (op === "insert" && insertedKey !== undefined && collection.store.get(insertedKey)) {
    return new Error(`"${collection.name}" already holds a row with the key ${String(insertedKey)}`);
  }
  if (op === "update" && keyField in input && input[keyField] !== key) {
    return new Error(`An update cannot change the key of a row in "${collection.name}"`);
  }
  return undefined;
};

/**
 * Validates a write against the collection's schema. An insert is validated as a row; an update is validated merged
 * with the current row, and only its changed fields are kept. A delete, a collection without a schema, and an update of
 * a row the db does not hold pass as they are.
 */
const prepareWrite = ({
  collection,
  op,
  key,
  input,
}: {
  collection: CollectionRuntime;
  op: MutationOperation;
  key: RowKey | undefined;
  input: StoreRow;
}): PreparedValues | Promise<PreparedValues> => {
  const { schema } = collection.config;
  const current = op === "update" ? collection.store.get(key!) : undefined;
  // An update that carries `undefined` for a field leaves that field as it is; `null` clears it
  const defined =
    op === "update" ? Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) : input;
  if (!schema || op === "delete" || (op === "update" && !current)) {
    return { values: defined };
  }
  const candidate = op === "update" ? { ...current, ...defined } : input;
  const finish = (result: Awaited<ReturnType<(typeof schema)["~standard"]["validate"]>>): PreparedValues => {
    if (result.issues) {
      return { issues: result.issues };
    }
    const output = result.value as StoreRow;
    return {
      values:
        op === "insert" ? output : Object.fromEntries(Object.keys(defined).map((field) => [field, output[field]])),
    };
  };
  const validation = schema["~standard"].validate(candidate);
  return validation instanceof Promise ? validation.then(finish) : finish(validation);
};

type HandleOf<C> = C extends {
  __types?: {
    row: infer Row;
    input: infer Input;
    key: infer KeyField;
    loaders: infer Loaders;
    mutations: infer Mutations;
  };
}
  ? [KeyField, Loaders, Mutations] extends [KeyFieldOf<Row>, LoaderDescriptor, MutationDescriptor]
    ? CollectionHandle<
        Row,
        Input,
        KeyField & KeyFieldOf<Row>,
        Loaders & LoaderDescriptor,
        Mutations & MutationDescriptor
      >
    : never
  : never;

/** The writes a transaction can make to one collection. Named transactions can write any collection. */
type TransactionHandleOf<C, Named extends boolean> = C extends {
  __types?: { row: infer Row; input: infer Input; key: infer KeyField; mutations: infer Mutations };
}
  ? KeyField extends keyof Row
    ? Named extends true
      ? {
          /** Needs its key, because one request cannot tell which key the server gave which row */
          insert: (row: Input & { [Field in KeyField]: NonNullable<Row[KeyField]> }) => void;
          update: (key: NonNullable<Row[KeyField]>, changes: Partial<Row>) => void;
          delete: (key: NonNullable<Row[KeyField]>) => void;
        }
      : {
          insert: Mutations extends { insert: infer Inserted }
            ? (row: Inserted & { [Field in KeyField]: NonNullable<Row[KeyField]> }) => void
            : never;
          update: Mutations extends { update: infer Changes }
            ? (key: NonNullable<Row[KeyField]>, changes: Changes) => void
            : never;
          delete: Mutations extends { delete: true } ? (key: NonNullable<Row[KeyField]>) => void : never;
        }
    : never
  : never;

/** What a transaction callback receives: one handle per collection, which records writes instead of sending them */
export type TransactionHandles<Collections, Named extends boolean> = {
  [Name in keyof Collections]: TransactionHandleOf<Collections[Name], Named>;
};

type TransactionMethod<Collections, Transactions> = {
  /**
   * Groups writes into one optimistic layer, kept or dropped as a whole. Each write goes through its collection's
   * `mutate`, in order; when one fails, the writes after it are dropped and the subsets holding rows already written
   * refetch.
   */
  (callback: (tx: TransactionHandles<Collections, false>) => void): Transaction;
  /**
   * Groups writes into one optimistic layer and sends them as one request, through the `mutationFn` of the named
   * transaction in `createDb`. The name is stored in the outbox, so the transaction can be replayed after a restart.
   */
  <Name extends keyof Transactions & string>(
    name: Name,
    callback: (tx: TransactionHandles<Collections, true>) => void,
  ): Transaction;
};

type ReservedName = "clear" | "destroy" | "ready" | "onError" | "transaction" | "dehydrate" | "inspect" | "onChange";

export type DbMethods = {
  /** Resolves once persisted rows and the outbox are restored */
  ready: Promise<void>;
  /** Removes every row, loaded subset and pending write, and the persisted data of the scope, for example on sign-out */
  clear: () => Promise<void>;
  /** Stops every sync, timer and tab channel */
  destroy: () => void;
  /** Listens to failed writes, rejected validation, outbox and persistence errors */
  onError: (listener: (event: DbErrorEvent) => void) => () => void;
  /**
   * The server rows and loaded subsets, as type-tagged JSON, for server rendering. Optimistic layers, the outbox and
   * syncs are never included. Pass it to `createDb(collections, { state })` on the client.
   */
  dehydrate: () => DehydratedDb;
  /** What the db holds right now: collections with their layers and subsets, live queries and the outbox */
  inspect: () => DbInspection;
  /** Listens to every change the db makes, once per batch of writes, load or outbox change */
  onChange: (listener: () => void) => () => void;
};

export type Db<Collections extends Record<string, CollectionInstance>, Transactions = unknown> = {
  [Name in keyof Collections]: HandleOf<Collections[Name]>;
} & DbMethods & { transaction: TransactionMethod<Collections, Transactions> };

type TransactionCallback = (tx: Record<string, Record<MutationOperation, (...args: never[]) => void>>) => void;

type RecordedWrite = { collection: string; op: MutationOperation; key: RowKey | undefined; input: StoreRow };

/** Records the writes a transaction callback makes, validates them, and submits them together */
const runTransaction = (runtime: DbRuntime, name: string | undefined, callback: TransactionCallback): Transaction => {
  const id = createId();
  const recorded: RecordedWrite[] = [];
  const tx = Object.fromEntries(
    [...runtime.collections.keys()].map((collection) => [
      collection,
      {
        insert: (row: StoreRow) => recorded.push({ collection, op: "insert", key: undefined, input: row }),
        update: (key: RowKey, changes: StoreRow) => recorded.push({ collection, op: "update", key, input: changes }),
        delete: (key: RowKey) => recorded.push({ collection, op: "delete", key, input: {} }),
      },
    ]),
  );
  callback(tx as never);

  const fail = (error: unknown) => runtime.mutations.reject(error, id);
  const writes = recorded.map((write) => {
    const collection = runtime.collections.get(write.collection)!;
    const key = write.op === "insert" ? (write.input[collection.config.key] as RowKey | undefined) : write.key;
    return {
      collection,
      op: write.op,
      key,
      prepared: prepareWrite({ collection, op: write.op, key, input: write.input }),
    };
  });
  if (writes.some((write) => write.key === undefined || write.key === null)) {
    return fail(new Error("An insert in a transaction needs its key, such as a UUID generated on the client"));
  }
  const submit = (results: PreparedValues[]) => {
    const invalid = results.find((result): result is { issues: unknown } => "issues" in result);
    if (invalid) {
      runtime.emitError({ type: "validation", error: invalid.issues });
      return fail(invalid.issues);
    }
    return runtime.mutations.submitTransaction({
      id,
      name,
      writes: writes.map((write, index) => ({
        collection: write.collection,
        op: write.op,
        key: write.key!,
        values: (results[index] as { values: StoreRow }).values,
      })),
    });
  };
  const prepared = writes.map((write) => write.prepared);
  if (prepared.some((item) => item instanceof Promise)) {
    return createTransaction(id, Promise.all(prepared).then(submit));
  }
  return submit(prepared as PreparedValues[]);
};

/**
 * Creates the db that queries and writes go through. The names given to it are the names on the db, as in `db.post`.
 * Requests carry their Client and listeners carry their Socket, so it needs neither.
 *
 * @example
 * const db = createDb({ post: Post, user: User });
 */
export const createDb = <Collections extends Record<string, CollectionInstance>, Transactions>(
  collections: Collections & { [Name in Extract<keyof Collections, ReservedName>]: never },
  options?: DbOptions & {
    /**
     * Collections that hold the same records in different shapes, such as `["post", "postSummary"]`. A write, delete
     * or optimistic change to one changes the fields the other has, for the same key.
     */
    links?: readonly (readonly [keyof Collections & string, keyof Collections & string])[];
    /** Named transactions: each sends the writes of `db.transaction(name, ...)` as one request */
    transactions?: Transactions & Record<string, TransactionConfig>;
  },
): Db<Collections, Transactions> => {
  const runtime = new DbRuntime(collections, options);
  const methods: DbMethods = {
    ready: runtime.ready,
    clear: runtime.clear,
    destroy: runtime.destroy,
    onError: runtime.onError,
    dehydrate: runtime.dehydrate,
    inspect: runtime.inspect,
    onChange: runtime.onChange,
  };
  const handles = Object.fromEntries(
    Object.keys(collections).map((name) => [name, new CollectionHandle(runtime, name)]),
  );
  const transaction = (first: string | TransactionCallback, second?: TransactionCallback) => {
    const [name, callback] = typeof first === "string" ? [first, second!] : [undefined, first];
    return runTransaction(runtime, name, callback);
  };
  return { ...handles, ...methods, transaction } as Db<Collections, Transactions>;
};
