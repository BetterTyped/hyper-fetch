import type { ResponseType } from "adapter";
import type { RequestInstance } from "request";
import type {
  ExtractAdapterType,
  ExtractErrorType,
  ExtractParamsType,
  ExtractPayloadType,
  ExtractQueryParamsType,
  ExtractResponseType,
  HydrateDataType,
} from "types";

/** Part of the request that holds the paging field */
export type PaginationSource = "queryParams" | "params" | "payload";

export type PaginationMode = "page" | "offset" | "cursor";

type PaginationFields<R, In extends PaginationSource> = NonNullable<
  In extends "params" ? ExtractParamsType<R> : In extends "payload" ? ExtractPayloadType<R> : ExtractQueryParamsType<R>
>;

type KeyOf<T> = Extract<keyof T, string>;

type NumericFieldKey<T> = { [K in KeyOf<T>]-?: number extends NonNullable<T[K]> ? K : never }[KeyOf<T>];
type ArrayFieldKey<T> = { [K in KeyOf<T>]-?: NonNullable<T[K]> extends readonly unknown[] ? K : never }[KeyOf<T>];
type NumberFieldKey<T> = { [K in KeyOf<T>]-?: NonNullable<T[K]> extends number ? K : never }[KeyOf<T>];
type CursorFieldKey<T> = { [K in KeyOf<T>]-?: NonNullable<T[K]> extends string | number ? K : never }[KeyOf<T>];

/**
 * Passed to every pagination callback
 */
export type PaginationContext<R> = {
  /** Response data of the page */
  data: ExtractResponseType<R>;
  /** Value of the paging field used to fetch this page */
  param: unknown;
  /** Response data of the pages loaded so far */
  pages: ExtractResponseType<R>[];
};

type PaginationItems<R> = (context: PaginationContext<R>) => readonly unknown[];
type PaginationCursor<R> = (context: PaginationContext<R>) => string | number | null | undefined;

type PaginationItemsOption<R> =
  ExtractResponseType<R> extends readonly unknown[]
    ? {
        /** Where the items are. Not needed when the response is an array. */
        items?: PaginationItems<R>;
      }
    : {
        /** Array field of the response holding the items, or a function returning them */
        items: ArrayFieldKey<NonNullable<ExtractResponseType<R>>> | PaginationItems<R>;
      };

type PaginationShared<R> = PaginationItemsOption<R> & {
  /** Number field of the response with the size of the whole list, or a function returning it */
  total?:
    | NumberFieldKey<NonNullable<ExtractResponseType<R>>>
    | ((context: PaginationContext<R>) => number | null | undefined);
  /** Overrides detecting the end of the list */
  hasNext?: (context: PaginationContext<R>) => boolean;
  /** Overrides detecting the start of the list */
  hasPrevious?: (context: PaginationContext<R>) => boolean;
};

type PaginationModes<R, In extends PaginationSource> =
  | {
      /** Numeric field holding the page number */
      page: NumericFieldKey<PaginationFields<R, In>>;
      /** Numeric field holding the page size */
      limit?: NumericFieldKey<PaginationFields<R, In>>;
      offset?: never;
      cursor?: never;
      next?: never;
      previous?: never;
    }
  | {
      /** Numeric field holding the number of skipped items */
      offset: NumericFieldKey<PaginationFields<R, In>>;
      /** Numeric field holding the page size */
      limit: NumericFieldKey<PaginationFields<R, In>>;
      page?: never;
      cursor?: never;
      next?: never;
      previous?: never;
    }
  | {
      /** Field holding the cursor */
      cursor: KeyOf<PaginationFields<R, In>>;
      /** Response field with the cursor of the next page, or a function returning it */
      next: CursorFieldKey<NonNullable<ExtractResponseType<R>>> | PaginationCursor<R>;
      /** Response field with the cursor of the previous page, or a function returning it */
      previous?: CursorFieldKey<NonNullable<ExtractResponseType<R>>> | PaginationCursor<R>;
      page?: never;
      offset?: never;
      limit?: never;
    };

/**
 * Describes which fields of a request page through a list. Every key is checked against the request types.
 *
 * @example
 * ```ts
 * const pagination = { cursor: "cursor", next: "nextCursor", items: "data" } satisfies Pagination<typeof getFeed>;
 * ```
 */
export type Pagination<R> = PaginationShared<R> &
  (
    | (PaginationModes<R, "queryParams"> & { in?: "queryParams" })
    | (PaginationModes<R, "params"> & { in: "params" })
    | (PaginationModes<R, "payload"> & { in: "payload" })
  );

type ArrayItem<T> = NonNullable<T> extends readonly (infer Item)[] ? Item : never;

/**
 * Type of a single list item for the given request and pagination
 */
export type PaginationItem<R, P> = P extends { items: infer Items }
  ? Items extends (...args: any[]) => infer Output
    ? ArrayItem<Output>
    : Items extends keyof NonNullable<ExtractResponseType<R>>
      ? ArrayItem<NonNullable<ExtractResponseType<R>>[Items]>
      : never
  : ArrayItem<ExtractResponseType<R>>;

/**
 * Untyped form of the pagination, used where the request type is not known
 */
export type PaginationConfig = {
  page?: string;
  offset?: string;
  limit?: string;
  cursor?: string;
  next?: string | ((context: any) => unknown);
  previous?: string | ((context: any) => unknown);
  items?: string | ((context: any) => readonly unknown[]);
  total?: string | ((context: any) => number | null | undefined);
  hasNext?: (context: any) => boolean;
  hasPrevious?: (context: any) => boolean;
  in?: PaginationSource;
};

export type PaginationPageContext = {
  request: RequestInstance;
  pagination: PaginationConfig;
  data: any;
  param: unknown;
  pages: any[];
};

export type CachedInfinitePage<T = any> = {
  param: unknown;
  request: RequestInstance;
  value: T;
};

export type FetchInfiniteOptions<P> = {
  pagination: P;
  /** How many pages to fetch, one after another. Defaults to 1. */
  pages?: number;
};

export type FetchInfiniteResult<R extends RequestInstance, P> = {
  /** Items of all the fetched pages */
  items: PaginationItem<R, P>[];
  /** Response data of the fetched pages */
  pages: ExtractResponseType<R>[];
  /** Paging values of the fetched pages */
  pageParams: unknown[];
  /** Size of the whole list, when the pagination declares `total` */
  total: number | null;
  hasNextPage: boolean;
  /** Error of the page that stopped fetching */
  error: ExtractErrorType<R> | null;
  /** Full responses of the fetched pages */
  responses: ResponseType<ExtractResponseType<R>, ExtractErrorType<R>, ExtractAdapterType<R>>[];
  /** Pass it to `client.hydrate()` or the `Hydrate` component */
  dehydrated: HydrateDataType[];
};
