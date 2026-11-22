import type { ExtractQueryParamsType, ExtractResponseType, ExtractUrlParams, RequestInstance } from "@hyper-fetch/core";

import type {
  DefaultRows,
  Inferred,
  IsExactRow,
  IsPartialRow,
  KeyLoaderDescriptor,
  ListLoaderDescriptor,
  MutationSuccessMode,
  RequestPatch,
} from "./collection.types";

type MethodKey = "$get" | "$post" | "$put" | "$patch" | "$delete";

/** The `$param` segment of an SDK resource that reads one row, such as `$postId` */
export type SdkItemKey<Node> = {
  [Key in keyof Node & `$${string}`]: Key extends MethodKey
    ? never
    : Node[Key] extends { $get: RequestInstance }
      ? Key
      : never;
}[keyof Node & `$${string}`];

type ListRequest<Node> = Node extends { $get: infer Req } ? Req : never;

type EndpointOf<Req> = Req extends { endpoint: infer Endpoint extends string } ? Endpoint : string;

/** Path params of the list endpoint that are row fields. They become required `eq` filters. */
export type ResourcePathFilters<Row, Node> = Extract<
  keyof NonNullable<ExtractUrlParams<EndpointOf<ListRequest<Node>>>>,
  keyof Row
> &
  string;

/** Query params of the list endpoint that are row fields, which `.resource()` can send as `eq` filters */
export type ResourceQueryFilters<Row, Node> = Extract<
  keyof NonNullable<ExtractQueryParamsType<ListRequest<Node>>>,
  keyof Row
> &
  string;

export type ResourceListOptions<Row, Node, Mapped, Filters, Cursor> = {
  /** Reads complete rows from the list response */
  rows?: (response: ExtractResponseType<ListRequest<Node>>) => readonly Mapped[];
  /** Query params sent as `eq` filters. Only query params that are row fields of the same name are offered. */
  where?: readonly (Filters & ResourceQueryFilters<Row, Node>)[];
  /** Reads the next page's cursor, which makes the list paginated */
  cursor?: (response: ExtractResponseType<ListRequest<Node>>) => Cursor | null | undefined;
  /** Sends a cursor to load the page after it */
  page?: (cursor: Cursor) => RequestPatch<ListRequest<Node>>;
};

export type ResourceOptions<Row, Node, Item, Mapped, Filters, Cursor, InsertSuccess, UpdateSuccess> = {
  /** The segment that reads one row, such as `"$postId"` for `/posts/:postId` */
  item: Item & SdkItemKey<Node>;
  /** The list loader, or `false` when the list returns another shape and belongs to its own collection */
  list?: false | ResourceListOptions<Row, Node, Mapped, Filters, Cursor>;
  insert?: { onSuccess?: InsertSuccess & MutationSuccessMode };
  update?: { method?: "$patch" | "$put"; onSuccess?: UpdateSuccess & MutationSuccessMode };
};

type ItemNode<Node, Item> = Item extends keyof Node ? Node[Item] : never;

type UpdateRequestOf<Node, Item> =
  ItemNode<Node, Item> extends { $patch: infer Req }
    ? Req
    : ItemNode<Node, Item> extends { $put: infer Req }
      ? Req
      : never;

export type ResourceLoaders<Row, Node, Item, Filters, Cursor, ListGiven> =
  | (ListGiven extends true
      ? ListLoaderDescriptor<
          ResourcePathFilters<Row, Node>,
          `${ResourcePathFilters<Row, Node> | (Filters & string)}:eq`,
          never,
          unknown extends Cursor ? false : true
        >
      : never)
  | (ItemNode<Node, Item> extends { $get: RequestInstance } ? KeyLoaderDescriptor : never);

/** Whether every derived loader and mutation reads rows that fit the collection */
export type IsResourceValid<
  Row,
  KeyField extends keyof Row,
  Node,
  Item,
  Mapped,
  ListGiven,
  InsertSuccess,
  UpdateSuccess,
> = [
  ListGiven extends true ? IsExactRow<Inferred<Mapped, DefaultRows<ListRequest<Node>>>, Row> : true,
  ItemNode<Node, Item> extends { $get: infer Req } ? IsExactRow<DefaultRows<Req>, Row> : true,
  Node extends { $post: infer Req }
    ? unknown extends InsertSuccess
      ? IsExactRow<ExtractResponseType<Req>, Row>
      : true
    : true,
  [UpdateRequestOf<Node, Item>] extends [never]
    ? true
    : unknown extends UpdateSuccess
      ? IsPartialRow<ExtractResponseType<UpdateRequestOf<Node, Item>>, Row, KeyField>
      : true,
] extends [true, true, true, true]
  ? true
  : false;

export type ResourceMutations<Input, Row, Node, Item> = (Node extends { $post: RequestInstance }
  ? { insert: Input }
  : {}) &
  ([UpdateRequestOf<Node, Item>] extends [never] ? {} : { update: Partial<Row> }) &
  (ItemNode<Node, Item> extends { $delete: RequestInstance } ? { delete: true } : {});
