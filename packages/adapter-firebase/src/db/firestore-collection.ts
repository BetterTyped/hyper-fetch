import type { ClientInstance } from "@hyper-fetch/core";
import type {
  CollectionConfig,
  ComparisonOperator,
  InferSchemaInput,
  InferSchemaOutput,
  KeyFieldOf,
  KeyLoaderDescriptor,
  ListLoaderDescriptor,
  Notation,
  StandardSchemaV1,
} from "@hyper-fetch/db";
import { Collection } from "@hyper-fetch/db";
import type { SocketInstance } from "@hyper-fetch/sockets";
import type { WhereFilterOp } from "firebase/firestore";

import { $orderBy, $where } from "../constraints";

/** A document as the Firebase adapter returns it: its data plus its id as `__key` */
type FirestoreDocument = Record<string, unknown> & { __key: string };

type GroupedResult = Record<"added" | "modified" | "removed", FirestoreDocument[]> | null;

/** How the db's operators map to Firestore's `where` operators */
const firestoreOperators: Record<ComparisonOperator, WhereFilterOp> = {
  eq: "==",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
  inArray: "in",
};

/** Fields whose values are strings, which can hold a Firestore document id */
type StringKeyFieldOf<Row> = {
  [Field in keyof Row]-?: NonNullable<Row[Field]> extends string ? Field : never;
}[keyof Row] &
  string;

export type FirestoreCollectionOptions<Row, KeyField extends string> = {
  /** A client whose adapter is `FirebaseAdapter` for the Firestore database */
  client: ClientInstance;
  /** A socket whose adapter is `FirebaseSocketsAdapter` for the same database */
  socket: SocketInstance;
  /** The collection's path, such as `"posts"` */
  path: string;
  /** The row field that holds the document id */
  key: KeyField;
  /** A field that grows with every change, so older writes never replace newer fields */
  version?: Exclude<keyof Row & string, KeyField>;
};

/** What the types know about a Firestore collection's loaders: any condition and order, and reads by key */
export type FirestoreLoaders<Row> =
  | ListLoaderDescriptor<never, `${keyof Row & string}:${ComparisonOperator}`, keyof Row & string, false>
  | KeyLoaderDescriptor;

export type FirestoreMutations<Input, Row> = { insert: Input; update: Partial<Row>; delete: true };

/**
 * A `@hyper-fetch/db` collection for a Firestore collection, declared in one call. Every operator and order maps to
 * Firestore query constraints, `onSnapshot` keeps every loaded subset live, and writes use Firestore's own local
 * writes and offline queue, so they add no optimistic layer and skip the outbox. Firestore is schemaless, so data
 * from the server is validated against the schema.
 *
 * Inserts need the key, because Firestore stores the document under it. Generate it on the client, for example with
 * `crypto.randomUUID()`.
 *
 * @example
 * const Post = firestoreCollection(PostSchema, { client, socket, path: "posts", key: "id" });
 * const db = createDb({ post: Post });
 */
export const firestoreCollection = <
  Schema extends StandardSchemaV1,
  KeyField extends StringKeyFieldOf<InferSchemaOutput<Schema>> & KeyFieldOf<InferSchemaOutput<Schema>>,
>(
  schema: Schema,
  options: FirestoreCollectionOptions<InferSchemaOutput<Schema>, KeyField>,
): Collection<
  InferSchemaOutput<Schema>,
  InferSchemaInput<Schema>,
  KeyField,
  FirestoreLoaders<InferSchemaOutput<Schema>>,
  FirestoreMutations<InferSchemaInput<Schema>, InferSchemaOutput<Schema>>
> => {
  const { client, socket, path, key, version } = options;
  const toRow = ({ __key, ...data }: FirestoreDocument) => ({ ...data, [key]: __key });
  const withoutKey = (row: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(row).filter(([field]) => field !== key));
  const toConstraint = (field: string, op: ComparisonOperator, value: unknown) =>
    $where(field, firestoreOperators[op], value);

  const notation: Notation = {
    where: Object.fromEntries(
      Object.keys(firestoreOperators).map((op) => [
        op,
        (field: string, value: unknown) => ({ queryParams: [toConstraint(field, op as ComparisonOperator, value)] }),
      ]),
    ),
    orderBy: (field, direction) => ({ queryParams: [$orderBy(field, direction)] }),
  };

  const document = `${path}/:docId`;
  const getDocs = client.createRequest<{ response: FirestoreDocument[] }>()({ endpoint: path, method: "getDocs" });
  const getDoc = client.createRequest<{ response: FirestoreDocument | null }>()({
    endpoint: document,
    method: "getDoc",
  });
  const setDoc = client.createRequest<{ response: unknown; payload: unknown }>()({
    endpoint: document,
    method: "setDoc",
  });
  const updateDoc = client.createRequest<{ response: unknown; payload: unknown }>()({
    endpoint: document,
    method: "updateDoc",
  });
  const deleteDoc = client.createRequest<{ response: unknown }>()({ endpoint: document, method: "deleteDoc" });
  const onSnapshot = socket.createListener<FirestoreDocument[]>()({
    topic: path,
    options: { groupByChangeType: true },
  });
  const onDocSnapshot = socket.createListener<FirestoreDocument | null>()({ topic: document });
  const toDocument = (id: unknown) => ({ params: { docId: id } });
  const backendWrite = { onSuccess: "keep" as const, optimistic: false, outbox: false };

  const config: CollectionConfig = {
    schema,
    key,
    version,
    validate: "all",
    ingests: [],
    loaders: [
      {
        kind: "list",
        request: getDocs,
        rows: (documents) => (documents as FirestoreDocument[]).map(toRow),
        notation,
      },
      {
        kind: "byKey",
        request: getDoc,
        byKey: toDocument,
        rows: (document) => (document ? [toRow(document as FirestoreDocument)] : []),
      },
    ],
    syncs: [
      {
        listener: onSnapshot,
        type: "changes",
        // Documents that left a filtered query may have changed or gone, so they are read again
        changes: (event) => {
          const grouped = (event as { extra: { groupedResult: GroupedResult } }).extra.groupedResult;
          return {
            upsert: [...(grouped?.added ?? []), ...(grouped?.modified ?? [])].map(toRow),
            delete: [],
            refetch: (grouped?.removed ?? []).map((removed) => removed.__key),
          };
        },
        notation: (conditions) => ({
          queryParams: conditions.map((condition) => toConstraint(condition.field, condition.op, condition.value)),
        }),
      },
      {
        // A document read by key gets a listener on that document, never one on the whole collection
        listener: onDocSnapshot,
        type: "changes",
        byKey: toDocument,
        changes: (event) => {
          const { data, extra } = event as { data: FirestoreDocument | null; extra: { ref: { id: string } } };
          return data ? { upsert: [toRow(data)], delete: [] } : { upsert: [], delete: [extra.ref.id] };
        },
      },
    ],
    mutations: {
      insert: {
        request: setDoc,
        map: (row) => ({ ...toDocument(row[key]), payload: withoutKey(row) }),
        ...backendWrite,
      },
      update: {
        request: updateDoc,
        map: (rowKey, changes) => ({ ...toDocument(rowKey), payload: withoutKey(changes) }),
        ...backendWrite,
      },
      delete: { request: deleteDoc, map: toDocument, ...backendWrite },
    },
  };
  return new Collection(config) as never;
};
