import type {
  ExtractParamsType,
  ExtractPayloadType,
  ExtractQueryParamsType,
  ExtractResponseType,
  RequestInstance,
} from "@hyper-fetch/core";
import type { ExtractListenerDeliveredType, ListenerInstance } from "@hyper-fetch/sockets";

import type { ComparisonNode, ComparisonOperator } from "../operators/operators.types";
import type { StandardSchemaV1 } from "../schema/schema.types";

export type SortDirection = "asc" | "desc";

/** Fields whose values can be a key: strings and numbers */
export type KeyFieldOf<Row> = {
  [Field in keyof Row]-?: NonNullable<Row[Field]> extends string | number ? Field : never;
}[keyof Row] &
  string;

export type RowKey = string | number;

type PartialIfObject<T> = T extends Record<string, unknown> ? Partial<T> : T;

/**
 * What a loader, mapping or mutation adds to a request: path params, query params and payload, each checked against
 * the request's own types. Objects are merged into what the request already has.
 */
export type RequestPatch<Req> = {
  params?: PartialIfObject<NonNullable<ExtractParamsType<Req>>>;
  queryParams?: PartialIfObject<NonNullable<ExtractQueryParamsType<Req>>>;
  payload?: PartialIfObject<NonNullable<ExtractPayloadType<Req>>>;
};

/** A patch without request types, used by the db-wide default notation */
export type AnyRequestPatch = {
  params?: Record<string, unknown>;
  queryParams?: Record<string, unknown> | string | readonly unknown[];
  payload?: unknown;
};

/** What a sync adds to a listener: topic params, a subscription payload or listener query params */
export type ListenerPatch = {
  params?: Record<string, unknown>;
  payload?: unknown;
  queryParams?: unknown;
};

/** How one field's operators reach the backend. `true` uses the db-wide default notation. */
export type FieldWhereDeclaration<Value, Req> = {
  eq?: ((value: Value) => RequestPatch<Req>) | true;
  gt?: ((value: NonNullable<Value>) => RequestPatch<Req>) | true;
  gte?: ((value: NonNullable<Value>) => RequestPatch<Req>) | true;
  lt?: ((value: NonNullable<Value>) => RequestPatch<Req>) | true;
  lte?: ((value: NonNullable<Value>) => RequestPatch<Req>) | true;
  inArray?: ((values: Value[]) => RequestPatch<Req>) | true;
  /** The endpoint cannot work without this filter, such as `teamId` in `/teams/:teamId/posts` */
  required?: true;
} & {
  /** Server-only operators by name, such as `search`, which queries use through `op("search", field, value)` */
  [operator: string]: ((value: never) => RequestPatch<Req>) | true | undefined;
};

export type WhereDeclaration<Row, Req> = { [Field in keyof Row & string]?: FieldWhereDeclaration<Row[Field], Req> };

export type OrderDeclaration<Row, Req> = {
  [Field in keyof Row & string]?: ((direction: SortDirection) => RequestPatch<Req>) | true;
};

type ResponseItem<Response> = Response extends readonly (infer Item)[] ? Item : Response;

/** A type argument that was not inferred is `unknown`: then use the fallback */
export type Inferred<T, Fallback> = unknown extends T ? Fallback : T;

/** Whether an optional option was given, judged by whether its type argument was inferred */
type IsGiven<T> = unknown extends T ? false : true;

/** The rows a loader writes when it has no `rows` mapping: the elements of a list, or the response itself */
export type DefaultRows<Req> = ResponseItem<ExtractResponseType<Req>>;

/** Whether mapped rows are exactly the collection's rows: nothing missing, nothing extra */
export type IsExactRow<Mapped, Row> = [Mapped] extends [Row]
  ? [Exclude<keyof Mapped, keyof Row>] extends [never]
    ? true
    : false
  : false;

/** Whether a partial write carries the key and only row fields of the same types */
export type IsPartialRow<Mapped, Row, KeyField extends keyof Row> = [Mapped] extends [
  Partial<Row> & Required<Pick<Row, KeyField>>,
]
  ? [Exclude<keyof Mapped, keyof Row>] extends [never]
    ? true
    : false
  : false;

/**
 * What a collection method returns when its rows do not match the collection's row type. It has no collection
 * methods, so chaining on it and passing it to `createDb` do not compile.
 */
export type RowMismatch<Received, Expected> = {
  readonly rowMismatch: { readonly received: Received; readonly expected: Expected };
};

/**
 * How a backend writes every operator and order, shipped by an adapter preset such as `firestoreCollection`. A loader
 * with a notation can send any condition and order on any field.
 */
export type Notation = {
  where?: Partial<Record<ComparisonOperator, (field: string, value: unknown) => AnyRequestPatch>>;
  orderBy?: (field: string, direction: SortDirection) => AnyRequestPatch;
};

export type LoaderOptions<Row, Key, Req, Mapped, Where, Order, Cursor, Limit, ByKey, ByKeys, LoaderNotation> = {
  /** How the backend writes every operator and order, so the loader sends conditions on any field */
  notation?: LoaderNotation & Notation;
  /**
   * Reads complete rows from a response, for example from a wrapped list such as `{ data: { items }, meta }` or by
   * reshaping each item. Without it, the response is the list of rows, or the row.
   */
  rows?: (response: ExtractResponseType<Req>) => readonly Mapped[];
  /** The operators the endpoint can serve for each field */
  where?: Where & WhereDeclaration<Row, Req>;
  /** The fields the endpoint can sort by */
  orderBy?: Order & OrderDeclaration<Row, Req>;
  /** Reads the next page's cursor from a response. Declaring it makes the loader paginated. */
  cursor?: (response: ExtractResponseType<Req>) => Cursor | null | undefined;
  /** Sends a cursor to load the page after it */
  page?: (cursor: Cursor) => RequestPatch<Req>;
  /** Sends a query's limit. Declaring it makes the loader paginated. */
  limit?: Limit & ((limit: number) => RequestPatch<Req>);
  /** Conditions the endpoint applies on its own, such as `{ archived: false }` */
  fixed?: Partial<Row>;
  /** Fields the backend compares differently from the client, so queries on them are never answered locally */
  serverOnly?: readonly (keyof Row & string)[];
  /** Reads one row by key. A loader with it serves `findOne`. */
  byKey?: ByKey & ((key: Key) => RequestPatch<Req>);
  /** Reads several rows by key in one request. A loader with it serves `findOne`, batched. */
  byKeys?: ByKeys & ((keys: Key[]) => RequestPatch<Req>);
};

/** What the types know about a loader that lists rows */
export type ListLoaderDescriptor<
  Required extends string = string,
  Tokens extends string = string,
  Order extends string = string,
  Paginated extends boolean = boolean,
> = {
  kind: "list";
  required: Required;
  tokens: Tokens;
  order: Order;
  paginated: Paginated;
};

/** What the types know about a loader that reads rows by key */
export type KeyLoaderDescriptor = { kind: "key" };

export type LoaderDescriptor = ListLoaderDescriptor | KeyLoaderDescriptor;

type RequiredFields<Where> = {
  [Field in keyof Where & string]: Where[Field] extends { required: true } ? Field : never;
}[keyof Where & string];

type WhereTokens<Where> = {
  [Field in keyof Where & string]: `${Field}:${Exclude<keyof Where[Field], "required"> & string}`;
}[keyof Where & string];

export type DescribeLoader<Row, Where, Order, Cursor, Limit, ByKey, ByKeys, LoaderNotation> =
  IsGiven<ByKey> extends true
    ? KeyLoaderDescriptor
    : IsGiven<ByKeys> extends true
      ? KeyLoaderDescriptor
      : ListLoaderDescriptor<
          RequiredFields<Inferred<Where, {}>>,
          | WhereTokens<Inferred<Where, {}>>
          | (IsGiven<LoaderNotation> extends true ? `${keyof Row & string}:${ComparisonOperator}` : never),
          (keyof Inferred<Order, {}> & string) | (IsGiven<LoaderNotation> extends true ? keyof Row & string : never),
          IsGiven<Cursor> extends true ? true : IsGiven<Limit>
        >;

export type SyncType = "insert" | "update" | "delete";

export type SyncMessage<Listener> = ExtractListenerDeliveredType<Listener>;

export type SyncOptions<Row, KeyField extends keyof Row, Listener, Type extends SyncType, Mapped> = {
  type: Type;
  /** Maps a query's filters to listener params or a subscription payload */
  where?: { [Field in keyof Row & string]?: { eq: (value: Row[Field]) => ListenerPatch } };
  /** Listener params that keep one row read by key live, such as a channel per record */
  byKey?: (key: NonNullable<Row[KeyField]>) => ListenerPatch;
  /** Reshapes a message into a row, or into the key and changed fields for `update` */
  row?: (message: SyncMessage<Listener>) => Mapped;
  /** Reads the key of a deleted row from a message */
  key?: (message: SyncMessage<Listener>) => NonNullable<Row[KeyField]>;
  /** Loads the row by key when an `update` arrives for a row the collection does not hold */
  incomplete?: "refetch";
  /** The adapter resumes the subscription from its last event id after a reconnect, so nothing is missed */
  resumes?: boolean;
};

export type IsSyncRow<Row, KeyField extends keyof Row, Type extends SyncType, Mapped> = Type extends "insert"
  ? IsExactRow<Mapped, Row>
  : Type extends "update"
    ? IsPartialRow<Mapped, Row, KeyField>
    : true;

/** The event a listener callback receives: `data` plus adapter details such as Firestore's grouped changes */
export type SyncEvent<Listener> = Listener extends { listen: (callback: infer Callback, ...rest: any[]) => any }
  ? Callback extends (event: infer Event) => any
    ? Event
    : never
  : never;

export type SyncChangesOptions<Row, KeyField extends keyof Row, Listener, Mapped> = {
  /** Reads the complete rows to write and the keys to delete from one event */
  changes: (event: SyncEvent<Listener>) => {
    upsert: readonly Mapped[];
    delete: readonly NonNullable<Row[KeyField]>[];
    /** Rows to load again by key, such as documents that left a filtered query and may have changed or gone */
    refetch?: readonly NonNullable<Row[KeyField]>[];
  };
  /** Turns a subset's sent conditions into listener params, so the sync covers every subset */
  notation?: (conditions: readonly ComparisonNode[]) => ListenerPatch;
  /** Listener params that keep one row read by key live, such as a listener on one document */
  byKey?: (key: NonNullable<Row[KeyField]>) => ListenerPatch;
  /** The adapter resumes the subscription from its last event id after a reconnect, so nothing is missed */
  resumes?: boolean;
};

export type IngestType = "insert" | "update";

export type IngestOptions<Req, Mapped, Type> = {
  /** Reads rows from the response, as a loader's `rows` does */
  rows?: (response: ExtractResponseType<Req>) => readonly Mapped[];
  /** `insert` writes complete rows, `update` changes only rows the collection holds */
  type?: Type & IngestType;
};

export type IsIngestRow<Row, KeyField extends keyof Row, Type extends IngestType, Mapped> = Type extends "update"
  ? IsPartialRow<Mapped, Row, KeyField>
  : IsExactRow<Mapped, Row>;

/** What happens after a mutation request succeeds with a response that is not the row */
export type MutationSuccessMode = "keep" | "refetch" | "sync";

export type MutationContext = {
  /** The transaction id. Send it as an idempotency key, so a request sent twice is applied once. */
  id: string;
};

export type InsertMutation<Row, Req, Mapped, Success> = {
  /** `false` when the backend applies writes locally on its own, such as Firestore, so the db adds no optimistic layer */
  optimistic?: boolean;
  /** `false` when the backend queues writes offline on its own, such as Firestore, so they skip the outbox */
  outbox?: boolean;
  request: Req;
  map: (row: Row, context: MutationContext) => RequestPatch<Req>;
  /** Reads the inserted row from the response */
  row?: (response: ExtractResponseType<Req>) => Mapped;
  /** Needed when the response is not the row */
  onSuccess?: Success & MutationSuccessMode;
};

export type UpdateMutation<Row, KeyField extends keyof Row, Req, Mapped, Success> = {
  /** `false` when the backend applies writes locally on its own, such as Firestore, so the db adds no optimistic layer */
  optimistic?: boolean;
  /** `false` when the backend queues writes offline on its own, such as Firestore, so they skip the outbox */
  outbox?: boolean;
  request: Req;
  map: (key: NonNullable<Row[KeyField]>, changes: Partial<Row>, context: MutationContext) => RequestPatch<Req>;
  /** Reads the key and changed fields from the response */
  row?: (response: ExtractResponseType<Req>) => Mapped;
  /** Needed when the response is not the row or its changed fields with the key */
  onSuccess?: Success & MutationSuccessMode;
};

export type DeleteMutation<Row, KeyField extends keyof Row, Req> = {
  /** `false` when the backend applies writes locally on its own, such as Firestore, so the db adds no optimistic layer */
  optimistic?: boolean;
  /** `false` when the backend queues writes offline on its own, such as Firestore, so they skip the outbox */
  outbox?: boolean;
  request: Req;
  map: (key: NonNullable<Row[KeyField]>, context: MutationContext) => RequestPatch<Req>;
  onSuccess?: MutationSuccessMode;
};

/** Whether a write's success is handled: it is not declared, its response fits, or `onSuccess` says what to do */
export type IsWriteHandled<Req, Fits, Success> =
  IsGiven<Req> extends true ? (IsGiven<Success> extends true ? true : Fits) : true;

/** The writes a collection can make, and the changes `update` accepts */
export type MutationDescriptor<Input = unknown, Changes = unknown> = {
  insert?: Input;
  update?: Changes;
  delete?: true;
};

type PayloadChanges<Row, Req> =
  NonNullable<ExtractPayloadType<Req>> extends Record<string, unknown>
    ? Partial<Pick<Row, Extract<keyof Row, keyof NonNullable<ExtractPayloadType<Req>>>>>
    : Partial<Row>;

export type DescribeMutations<Input, Row, InsertReq, UpdateReq, DeleteReq> = (IsGiven<InsertReq> extends true
  ? { insert: Input }
  : {}) &
  (IsGiven<UpdateReq> extends true ? { update: PayloadChanges<Row, UpdateReq> } : {}) &
  (IsGiven<DeleteReq> extends true ? { delete: true } : {});

/* Erased runtime configuration */

export type LoaderConfig = {
  kind: "list" | "byKey" | "byKeys";
  request: RequestInstance;
  rows?: (response: unknown) => readonly unknown[];
  where?: Record<string, Partial<Record<ComparisonOperator, unknown>> & { required?: true }>;
  notation?: Notation;
  orderBy?: Record<string, unknown>;
  cursor?: (response: unknown) => unknown;
  page?: (cursor: unknown) => AnyRequestPatch;
  limit?: (limit: number) => AnyRequestPatch;
  fixed?: Record<string, unknown>;
  serverOnly?: readonly string[];
  byKey?: (key: RowKey) => AnyRequestPatch;
  byKeys?: (keys: RowKey[]) => AnyRequestPatch;
};

export type SyncConfig = {
  listener: ListenerInstance;
  /** `changes` syncs read inserts and deletes from one event, such as a Firestore snapshot */
  type: SyncType | "changes";
  changes?: (event: unknown) => { upsert: readonly unknown[]; delete: readonly RowKey[]; refetch?: readonly RowKey[] };
  /** Covers every subset by turning its sent conditions into listener params, as adapter presets do */
  notation?: (conditions: readonly ComparisonNode[]) => ListenerPatch;
  where?: Record<string, { eq: (value: unknown) => ListenerPatch }>;
  byKey?: (key: RowKey) => ListenerPatch;
  row?: (message: unknown) => unknown;
  key?: (message: unknown) => RowKey;
  incomplete?: "refetch";
  resumes?: boolean;
};

export type IngestConfig = {
  request: RequestInstance;
  rows?: (response: unknown) => readonly unknown[];
  type: IngestType;
};

export type NormalizeConfig = {
  target: CollectionConfig;
  extract: (row: unknown) => readonly unknown[];
};

export type MutationConfig = {
  request: RequestInstance;
  map: (...args: any[]) => AnyRequestPatch;
  row?: (response: unknown) => unknown;
  onSuccess?: MutationSuccessMode;
  optimistic?: boolean;
  outbox?: boolean;
};

export type CollectionConfig = {
  schema?: StandardSchemaV1;
  key: string;
  version?: string;
  validate: "client" | "all";
  loaders: readonly LoaderConfig[];
  syncs: readonly SyncConfig[];
  ingests: readonly IngestConfig[];
  mutations: { insert?: MutationConfig; update?: MutationConfig; delete?: MutationConfig };
  /** Nested rows that complete writes carry into other collections */
  normalize?: readonly NormalizeConfig[];
};

export type CollectionOptions<Row, KeyField extends string> = {
  /** The field that identifies a row */
  key: KeyField;
  /** A field that grows with every change on the server. Writes never replace fields with a newer version. */
  version?: Exclude<keyof Row & string, KeyField>;
  /** `client` validates client writes only, `all` validates data from the server too */
  validate?: "client" | "all";
};
