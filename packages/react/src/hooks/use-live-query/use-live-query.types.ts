import type { ExtractQueryData, QueryState } from "@hyper-fetch/db";

export type UseLiveQueryReturnType<Query> = QueryState<ExtractQueryData<Query>> & {
  /** Loads the query's subset again */
  refetch: () => Promise<void>;
  /** Loads the next page of a paginated query */
  fetchNextPage: () => Promise<void>;
};
