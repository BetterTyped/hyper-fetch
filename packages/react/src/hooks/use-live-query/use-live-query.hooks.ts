import type { ExtractQueryData, QueryInstance, QueryState, ServableQuery } from "@hyper-fetch/db";
import { useCallback, useMemo, useSyncExternalStore } from "react";

import type { UseLiveQueryReturnType } from "./use-live-query.types";

/**
 * Reads a `@hyper-fetch/db` query and keeps the component current as the collection changes. The query starts at a
 * collection, as in `db.post.where(...)`, and loads through the loader the db picks for it.
 *
 * A query is data, so a query rebuilt on every render with the same structure is the same query: the hook takes no
 * dependency array. It does not compile when no loader of the collection can serve the query.
 *
 * @example
 * const { data, status, error } = useLiveQuery(
 *   db.postSummary.where((post) => eq(post.teamId, teamId)).orderBy((post) => post.createdAt, "desc"),
 * );
 */
export const useLiveQuery = <Query extends QueryInstance>(
  query: Query & ServableQuery<Query>,
): UseLiveQueryReturnType<Query> => {
  const { key } = query;
  // oxlint-disable-next-line react-hooks/exhaustive-deps -- the key is the query's identity
  const stableQuery = useMemo<QueryInstance>(() => query, [key]);

  const subscribe = useCallback((listener: () => void) => stableQuery.subscribe(listener), [stableQuery]);
  const getSnapshot = useCallback(
    () => stableQuery.getSnapshot() as QueryState<ExtractQueryData<Query>>,
    [stableQuery],
  );
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return useMemo(
    () => ({
      ...state,
      refetch: () => stableQuery.refetch(),
      fetchNextPage: () => stableQuery.fetchNextPage(),
    }),
    [state, stableQuery],
  );
};
