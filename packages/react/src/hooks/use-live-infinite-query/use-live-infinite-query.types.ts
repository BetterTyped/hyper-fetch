import type { ExtractQueryResult, InfiniteQueryState } from "@hyper-fetch/db";

export type UseLiveInfiniteQueryReturnType<Query> = InfiniteQueryState<ExtractQueryResult<Query>> & {
  /** Widens the window by one page, loading from the backend only when the db holds too few rows */
  fetchNextPage: () => Promise<void>;
  /** Loads the query again from its first page */
  refetch: () => Promise<void>;
};
