import type {
  ExtractAdapterExtraType,
  ExtractAdapterStatusType,
  ExtractAdapterType,
  ExtractErrorType,
  ExtractResponseType,
  Pagination,
  PaginationItem,
  RequestInstance,
  ResponseType,
} from "@hyper-fetch/core";

export type InfinitePageResponse<R extends RequestInstance> = ResponseType<
  ExtractResponseType<R>,
  ExtractErrorType<R>,
  ExtractAdapterType<R>
>;

export type InfinitePageEvent<R extends RequestInstance> = {
  /** Response of the page */
  response: InfinitePageResponse<R>;
  /** Request of the page */
  request: R;
  /** Value of the paging field used for this page */
  param: unknown;
};

export type UseInfiniteFetchOptionsType<
  R extends RequestInstance,
  P extends Pagination<R> = Pagination<R>,
  TSelected = PaginationItem<R, P>[],
> = {
  /**
   * Which fields of the request page through the list. Every key is checked against the request types.
   */
  pagination: P;
  /**
   * Drops items repeated across pages, for lists that shift while scrolling.
   * Name a field of the item or return the identity from a function.
   */
  uniqueBy?: Extract<keyof PaginationItem<R, P>, string> | ((context: { item: PaginationItem<R, P> }) => unknown);
  /**
   * Keeps only this many pages loaded. Pages at the opposite end are dropped and can be fetched again.
   */
  maxPages?: number;
  /**
   * Transforms the list used by the component. The cache stays shared with other hooks.
   */
  select?: (context: { items: PaginationItem<R, P>[]; pages: ExtractResponseType<R>[] }) => TSelected;
  /**
   * Suspends until the first page arrives. Later pages never suspend.
   */
  suspense?: boolean;
  /**
   * Throws the error to the closest Error Boundary once the page request settles.
   * Pass a function to decide per error.
   */
  throwOnError?: boolean | ((error: ExtractErrorType<R>) => boolean);
  /**
   * Refetches the loaded pages when any of these values change
   */
  dependencies?: any[];
  /**
   * Disables fetching
   */
  disabled?: boolean;
  /**
   * Rerenders only when the values used by the component change
   */
  dependencyTracking?: boolean;
  /**
   * Refetches pages restored from the cache on mount, even when they are not stale yet
   */
  revalidate?: boolean;
  /**
   * What is shown while a new list loads its first page:
   *
   * - "auto" (default) keeps the previous list when only query params changed, clears it for another resource
   * - "preserve" always keeps the previous list
   * - "clean" always clears it
   */
  keepPreviousData?: "auto" | "preserve" | "clean";
  /**
   * Refetches the loaded pages on an interval
   */
  refresh?: boolean;
  /**
   * Refresh interval time
   */
  refreshTime?: number;
  /**
   * Keeps refreshing while the tab is not focused
   */
  refetchBlurred?: boolean;
  /**
   * Refetches when the user leaves the tab
   */
  refetchOnBlur?: boolean;
  /**
   * Refetches when the user enters the tab
   */
  refetchOnFocus?: boolean;
  /**
   * Refetches when the network is restored
   */
  refetchOnReconnect?: boolean;
  /**
   * Keeps references of the unchanged parts of the list between updates
   */
  structuralSharing?: boolean;
  /**
   * Waits for the request to settle before starting a new list, for filters changing while typing
   */
  bounce?: boolean;
  /**
   * Bounce strategy
   */
  bounceType?: "debounce" | "throttle";
  /**
   * How long new lists are bounced
   */
  bounceTime?: number;
  /**
   * Only for the throttle strategy - handling of the last bounce event
   */
  bounceTimeout?: number;
};

export type UseInfiniteFetchConfigType = Partial<
  Omit<UseInfiniteFetchOptionsType<RequestInstance, any, any>, "pagination" | "select" | "uniqueBy" | "maxPages">
>;

export type UseInfiniteFetchReturnType<
  R extends RequestInstance,
  P extends Pagination<R> = Pagination<R>,
  TSelected = PaginationItem<R, P>[],
> = {
  /** Items of all the loaded pages */
  items: TSelected;
  /** Response data of the loaded pages */
  pages: ExtractResponseType<R>[];
  /** Paging values of the loaded pages */
  pageParams: unknown[];
  /** Size of the whole list, when the pagination declares `total` */
  total: number | null;
  /** Another page can be fetched after the loaded ones */
  hasNextPage: boolean;
  /** Another page can be fetched before the loaded ones */
  hasPreviousPage: boolean;
  /** First page is loading and there is nothing to show yet */
  loading: boolean;
  /** Any page of this list is being fetched */
  isFetching: boolean;
  /** Loaded pages are being fetched again */
  isRefetching: boolean;
  isFetchingNextPage: boolean;
  isFetchingPreviousPage: boolean;
  /** Last attempt of fetching the next page failed */
  isFetchNextPageError: boolean;
  /** Last attempt of fetching the previous page failed */
  isFetchPreviousPageError: boolean;
  /** The list on screen belongs to the previous request, the new one is still loading */
  isPreviousData: boolean;
  /** Error of the last fetch */
  error: ExtractErrorType<R> | null;
  /** Status of the last response */
  status: ExtractAdapterStatusType<ExtractAdapterType<R>> | null;
  /** Additional data of the last response */
  extra: ExtractAdapterExtraType<ExtractAdapterType<R>> | null;
  /** Last fetch succeeded */
  success: boolean;
  /** Fetches the page after the loaded ones. Calls made while it loads share one request. */
  fetchNextPage: () => Promise<InfinitePageResponse<R> | null>;
  /** Fetches the page before the loaded ones. Calls made while it loads share one request. */
  fetchPreviousPage: () => Promise<InfinitePageResponse<R> | null>;
  /** Fetches all the loaded pages again and swaps the list when they arrive */
  refetch: () => Promise<InfinitePageResponse<R> | null>;
  /** Drops to the starting page and fetches it again */
  reset: () => Promise<InfinitePageResponse<R> | null>;
  /** Cancels every page being fetched by this list */
  abort: () => void;
  /** Called for every page that succeeded */
  onSuccess: (callback: (event: InfinitePageEvent<R>) => void) => void;
  /** Called for every page that failed */
  onError: (callback: (event: InfinitePageEvent<R>) => void) => void;
  /** Called for every finished page */
  onFinished: (callback: (event: InfinitePageEvent<R>) => void) => void;
  /** Called when the list starts over, for example to scroll back to the top */
  onReset: (callback: () => void) => void;
  /** State of the bounce used for new lists */
  bounce: {
    active: boolean;
    reset: () => void;
  };
};
