import type { ExtractResponseType, RequestInstance } from "@hyper-fetch/core";
import type { ListenerInstance } from "@hyper-fetch/sockets";

import type { InferSchemaInput, InferSchemaOutput, StandardSchemaV1 } from "../schema/schema.types";
import type {
  AnyRequestPatch,
  CollectionConfig,
  CollectionOptions,
  DefaultRows,
  DeleteMutation,
  DescribeLoader,
  DescribeMutations,
  Inferred,
  IngestConfig,
  IngestOptions,
  IngestType,
  InsertMutation,
  IsExactRow,
  IsIngestRow,
  IsPartialRow,
  IsSyncRow,
  IsWriteHandled,
  KeyFieldOf,
  LoaderConfig,
  LoaderDescriptor,
  LoaderOptions,
  MutationConfig,
  MutationDescriptor,
  RowMismatch,
  SyncChangesOptions,
  SyncConfig,
  SyncMessage,
  SyncOptions,
  SyncType,
  UpdateMutation,
} from "./collection.types";
import type {
  IsResourceValid,
  ResourceListOptions,
  ResourceLoaders,
  ResourceMutations,
  ResourceOptions,
} from "./resource.types";

/**
 * A typed set of complete rows, defined by a schema and a key. It declares how its backend loads rows (`load`), keeps
 * them live (`sync`), feeds them from other responses (`ingest`) and changes them (`mutate`). A collection is
 * immutable: every method returns a new collection, so it is defined in one chain and passed to `createDb`.
 *
 * When rows a method reads do not match the row type, it returns a `RowMismatch` instead of a collection, so the chain
 * and `createDb` do not compile.
 */
export class Collection<
  Row,
  Input = Row,
  KeyField extends KeyFieldOf<Row> = KeyFieldOf<Row>,
  Loaders extends LoaderDescriptor = never,
  Mutations extends MutationDescriptor = {},
> {
  /** Type-only carrier of the collection's generics, never set at runtime */
  declare readonly __types?: { row: Row; input: Input; key: KeyField; loaders: Loaders; mutations: Mutations };

  constructor(readonly config: CollectionConfig) {}

  /**
   * Adds a loader: a request plus the way to read complete rows from its response. A list loader declares the filters
   * and orders it can send and whether it is paginated. A loader with `byKey` or `byKeys` reads rows by key.
   */
  load<Req extends RequestInstance, Mapped, Where, Order, Cursor, Limit, ByKey, ByKeys, LoaderNotation>(
    request: Req,
    options?: LoaderOptions<
      Row,
      NonNullable<Row[KeyField]>,
      Req,
      Mapped,
      Where,
      Order,
      Cursor,
      Limit,
      ByKey,
      ByKeys,
      LoaderNotation
    >,
  ): IsExactRow<Inferred<Mapped, DefaultRows<Req>>, Row> extends true
    ? Collection<
        Row,
        Input,
        KeyField,
        Loaders | DescribeLoader<Row, Where, Order, Cursor, Limit, ByKey, ByKeys, LoaderNotation>,
        Mutations
      >
    : RowMismatch<Inferred<Mapped, DefaultRows<Req>>, Row> {
    const loaderOptions = (options ?? {}) as Omit<LoaderConfig, "kind" | "request">;
    let kind: LoaderConfig["kind"] = "list";
    if (loaderOptions.byKey) {
      kind = "byKey";
    } else if (loaderOptions.byKeys) {
      kind = "byKeys";
    }
    const loader: LoaderConfig = { ...loaderOptions, kind, request };
    return new Collection({ ...this.config, loaders: [...this.config.loaders, loader] }) as never;
  }

  /**
   * Derives loaders and mutations from an SDK resource that follows REST conventions: `$get` lists, `item.$get` reads
   * by key, `$post` inserts, `item.$patch` or `item.$put` updates and `item.$delete` deletes. Path params of the list
   * endpoint become required `eq` filters, and the query params listed in `list.where` become `eq` filters.
   *
   * @example
   * collection(PostSchema, { key: "id" }).resource(sdk.posts, { item: "$postId" });
   */
  resource<Node, Item, Mapped, Filters, Cursor, InsertSuccess, UpdateSuccess, ListOption>(
    node: Node,
    options: ResourceOptions<Row, Node, Item, Mapped, Filters, Cursor, InsertSuccess, UpdateSuccess> & {
      list?: ListOption;
    },
  ): IsResourceValid<
    Row,
    KeyField,
    Node,
    Item,
    Mapped,
    ListOption extends false ? false : true,
    InsertSuccess,
    UpdateSuccess
  > extends true
    ? Collection<
        Row,
        Input,
        KeyField,
        Loaders | ResourceLoaders<Row, Node, Item, Filters, Cursor, ListOption extends false ? false : true>,
        Mutations & ResourceMutations<Input, Row, Node, Item>
      >
    : RowMismatch<unknown, Row> {
    type Endpoint = Record<string, RequestInstance & Record<string, unknown>>;
    const resourceNode = node as unknown as Endpoint;
    const itemKey = options.item as string;
    const itemParam = itemKey.slice(1);
    const itemNode = resourceNode[itemKey] as unknown as Endpoint;
    const toKeyPatch = (key: unknown): AnyRequestPatch => ({ params: { [itemParam]: key } });
    const loaders: LoaderConfig[] = [];
    const list =
      options.list === false
        ? undefined
        : ((options.list as ResourceListOptions<Row, Node, Mapped, Filters, Cursor> | undefined) ?? {});
    if (list) {
      const listRequest = resourceNode.$get;
      const endpoint = String(listRequest.requestOptions.endpoint);
      const pathParams = [...endpoint.matchAll(/:([A-Za-z0-9_]+)/g)].map((match) => match[1]);
      const where: NonNullable<LoaderConfig["where"]> = {};
      pathParams.forEach((param) => {
        where[param] = { eq: (value: unknown) => ({ params: { [param]: value } }), required: true };
      });
      (list.where ?? []).forEach((field) => {
        where[field as string] = { eq: (value: unknown) => ({ queryParams: { [field as string]: value } }) };
      });
      loaders.push({
        kind: "list",
        request: listRequest,
        rows: list.rows as LoaderConfig["rows"],
        where,
        cursor: list.cursor as LoaderConfig["cursor"],
        page: list.page as LoaderConfig["page"],
      });
    }
    loaders.push({ kind: "byKey", request: itemNode.$get, byKey: toKeyPatch });
    return new Collection({
      ...this.config,
      loaders: [...this.config.loaders, ...loaders],
      mutations: {
        ...this.config.mutations,
        insert: {
          request: resourceNode.$post,
          map: (row: unknown) => ({ payload: row }),
          onSuccess: options.insert?.onSuccess,
        },
        update: {
          request: itemNode[options.update?.method ?? "$patch"],
          map: (key: unknown, changes: unknown) => ({ ...toKeyPatch(key), payload: changes }),
          onSuccess: options.update?.onSuccess,
        },
        delete: { request: itemNode.$delete, map: (key: unknown) => toKeyPatch(key), onSuccess: "keep" },
      },
    }) as never;
  }

  /**
   * Keeps rows current from a listener. `insert` messages carry complete rows, `update` messages the key and some
   * fields, and `delete` messages the key. One listener can sync several collections.
   */
  sync<Listener extends ListenerInstance, Type extends SyncType, Mapped>(
    listener: Listener,
    options: SyncOptions<Row, KeyField, Listener, Type, Mapped>,
  ): IsSyncRow<Row, KeyField, Type, Inferred<Mapped, SyncMessage<Listener>>> extends true
    ? Collection<Row, Input, KeyField, Loaders, Mutations>
    : RowMismatch<Inferred<Mapped, SyncMessage<Listener>>, Row> {
    const sync = { ...options, listener } as SyncConfig;
    return new Collection({ ...this.config, syncs: [...this.config.syncs, sync] }) as never;
  }

  /**
   * Writes the rows nested in this collection's rows into another collection, for example the author of a post into
   * the `user` collection. It runs on every complete write from the server: loads, inserts, ingested responses and
   * mutation responses. The target is the collection itself, so renaming or removing it breaks the build.
   *
   * @example
   * collection(PostSchema, { key: "id" }).normalize(User, (post) => (post.author ? [post.author] : []));
   */
  normalize<TargetRow, Mapped>(
    target: { readonly config: CollectionConfig; readonly __types?: { row: TargetRow } },
    extract: (row: Row) => readonly Mapped[],
  ): ([Mapped] extends [never] ? true : IsExactRow<Mapped, TargetRow>) extends true
    ? Collection<Row, Input, KeyField, Loaders, Mutations>
    : RowMismatch<Mapped, TargetRow> {
    const normalize = [...(this.config.normalize ?? []), { target: target.config, extract: extract as never }];
    return new Collection({ ...this.config, normalize }) as never;
  }

  /**
   * Keeps rows current from a listener whose events carry several changes at once, such as a Firestore snapshot.
   * `changes` reads the complete rows to write and the keys to delete. With `notation`, the sync covers every subset
   * by sending its conditions to the listener. Adapter presets such as `firestoreCollection` use it.
   */
  syncChanges<Listener extends ListenerInstance, Mapped>(
    listener: Listener,
    options: SyncChangesOptions<Row, KeyField, Listener, Mapped>,
  ): ([Mapped] extends [never] ? true : IsExactRow<Mapped, Row>) extends true
    ? Collection<Row, Input, KeyField, Loaders, Mutations>
    : RowMismatch<Mapped, Row> {
    const sync = { ...options, type: "changes", listener } as SyncConfig;
    return new Collection({ ...this.config, syncs: [...this.config.syncs, sync] }) as never;
  }

  /**
   * Writes the rows of another request's responses into the collection, for example a search endpoint or a
   * `useSubmit` whose response is the changed row. The request does not become a loader.
   */
  ingest<Req extends RequestInstance, Mapped, Type>(
    request: Req,
    options?: IngestOptions<Req, Mapped, Type>,
  ): IsIngestRow<Row, KeyField, Inferred<Type, "insert"> & IngestType, Inferred<Mapped, DefaultRows<Req>>> extends true
    ? Collection<Row, Input, KeyField, Loaders, Mutations>
    : RowMismatch<Inferred<Mapped, DefaultRows<Req>>, Row> {
    const ingestOptions = (options ?? {}) as Partial<IngestConfig>;
    const ingest: IngestConfig = { ...ingestOptions, request, type: ingestOptions.type ?? "insert" };
    return new Collection({ ...this.config, ingests: [...this.config.ingests, ingest] }) as never;
  }

  /**
   * Declares how inserts, updates and deletes reach the backend. Each `map` turns the write into the request's params,
   * query params and payload. A response that is not the row needs `onSuccess`.
   */
  mutate<InsertReq, UpdateReq, DeleteReq, InsertMapped, UpdateMapped, InsertSuccess, UpdateSuccess>(mutations: {
    insert?: InsertMutation<Row, InsertReq, InsertMapped, InsertSuccess>;
    update?: UpdateMutation<Row, KeyField, UpdateReq, UpdateMapped, UpdateSuccess>;
    delete?: DeleteMutation<Row, KeyField, DeleteReq>;
  }): [
    IsWriteHandled<InsertReq, IsExactRow<Inferred<InsertMapped, ExtractResponseType<InsertReq>>, Row>, InsertSuccess>,
    IsWriteHandled<
      UpdateReq,
      IsPartialRow<Inferred<UpdateMapped, ExtractResponseType<UpdateReq>>, Row, KeyField>,
      UpdateSuccess
    >,
  ] extends [true, true]
    ? Collection<
        Row,
        Input,
        KeyField,
        Loaders,
        Mutations & DescribeMutations<Input, Row, InsertReq, UpdateReq, DeleteReq>
      >
    : RowMismatch<ExtractResponseType<InsertReq> | ExtractResponseType<UpdateReq>, Row> {
    const config = mutations as Record<"insert" | "update" | "delete", MutationConfig | undefined>;
    return new Collection({
      ...this.config,
      mutations: {
        ...this.config.mutations,
        ...(config.insert ? { insert: config.insert } : {}),
        ...(config.update ? { update: config.update } : {}),
        ...(config.delete ? { delete: config.delete } : {}),
      },
    }) as never;
  }
}

/** Any collection, whatever its row type */
export type CollectionInstance = {
  readonly config: CollectionConfig;
  readonly __types?: { row: any; input: any; key: any; loaders: any; mutations: any };
};

const emptyConfig = (options: CollectionOptions<any, string>, schema?: StandardSchemaV1): CollectionConfig => ({
  schema,
  key: options.key,
  version: options.version,
  validate: options.validate ?? "client",
  loaders: [],
  syncs: [],
  ingests: [],
  mutations: {},
});

/** A row type without a schema, for `collection(rowType<Post>(), { key: "id" })`. Rows are not validated. */
export type RowType<Row> = { readonly kind: "row-type"; readonly __row?: Row };

/** Declares a collection's row type without a schema, so writes are not validated */
export const rowType = <Row>(): RowType<Row> => ({ kind: "row-type" });

/**
 * Creates a collection from a Standard Schema, such as a Zod, Valibot or ArkType schema, or from `rowType<Row>()`.
 *
 * @example
 * const Post = collection(PostSchema, { key: "id", version: "updatedAt" });
 * const Draft = collection(rowType<Draft>(), { key: "id" });
 */
export function collection<Schema extends StandardSchemaV1, KeyField extends KeyFieldOf<InferSchemaOutput<Schema>>>(
  schema: Schema,
  options: CollectionOptions<InferSchemaOutput<Schema>, KeyField>,
): Collection<InferSchemaOutput<Schema>, InferSchemaInput<Schema>, KeyField>;
export function collection<Row, KeyField extends KeyFieldOf<Row>>(
  type: RowType<Row>,
  options: CollectionOptions<Row, KeyField>,
): Collection<Row, Row, KeyField>;
export function collection(
  schemaOrType: StandardSchemaV1 | RowType<unknown>,
  options: CollectionOptions<any, string>,
): CollectionInstance {
  const schema = "~standard" in schemaOrType ? schemaOrType : undefined;
  return new Collection(emptyConfig(options, schema));
}
