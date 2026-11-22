import type { InfiniteQueryCheck, InfiniteQueryOptions, QueryInstance } from "@hyper-fetch/db";
import { useCallback, useMemo, useSyncExternalStore } from "react";

import type { UseLiveInfiniteQueryReturnType } from "./use-live-infinite-query.types";

/**
 * Reads an ordered `@hyper-fetch/db` query page by page, as a window that `fetchNextPage` widens. Rows the db already
 * holds show at once, and the query's loader loads more only when the window runs past them, so the UI's page size is
 * independent of the backend's. The window stays live: inserts shift rows across pages, and deletes pull the next row
 * in.
 *
 * Like `useLiveQuery`, it takes no dependency array. The same query keeps its loaded pages across renders, and a
 * different query or page size starts again from the first page. The query must have `orderBy`.
 *
 * @example
 * const { pages, hasNextPage, fetchNextPage, isFetchingNextPage } = useLiveInfiniteQuery(
 *   db.post.where((post) => eq(post.teamId, teamId)).orderBy((post) => post.createdAt, "desc"),
 *   { pageSize: 20 },
 * );
 */
export const useLiveInfiniteQuery = <Query extends QueryInstance>(
  query: Query & InfiniteQueryCheck<Query>,
  options: InfiniteQueryOptions,
): UseLiveInfiniteQueryReturnType<Query> => {
  const { key } = query;
  const { pageSize } = options;
  // oxlint-disable-next-line react-hooks/exhaustive-deps -- the key and page size are the infinite query's identity
  const infinite = useMemo(() => (query as QueryInstance).infinite({ pageSize }), [key, pageSize]);

  const subscribe = useCallback((listener: () => void) => infinite.subscribe(listener), [infinite]);
  const getSnapshot = useCallback(() => infinite.getSnapshot(), [infinite]);
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return useMemo(
    () =>
      ({
        ...state,
        fetchNextPage: () => infinite.fetchNextPage(),
        refetch: () => infinite.refetch(),
      }) as UseLiveInfiniteQueryReturnType<Query>,
    [state, infinite],
  );
};
