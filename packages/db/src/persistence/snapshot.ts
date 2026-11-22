import type { RowKey } from "../collection/collection.types";
import type { CollectionRuntime } from "../db/collection.runtime";
import type { ListPlan } from "../query/planner";
import type { QueryDefinition } from "../query/query.types";
import type { Row } from "../store/store.types";

/** A loaded subset as persistence and server rendering keep it */
export type SubsetSnapshot = {
  plan: ListPlan;
  definition: Pick<QueryDefinition, "orderBy" | "limit">;
  owned: RowKey[];
  cursor: unknown;
  hasMore: boolean;
  /** How many pages a paginated subset had loaded, so a refetch reloads all of them */
  pages: number;
  /** When the subset loaded, or 0 when that is unknown */
  loadedAt: number;
};

/** A collection's server rows and loaded subsets. Optimistic layers are never part of it. */
export type CollectionSnapshot = {
  rows: [RowKey, Row][];
  subsets: SubsetSnapshot[];
};

export const snapshotCollection = (collection: CollectionRuntime): CollectionSnapshot => {
  const { store } = collection;
  return {
    rows: store.getServerKeys().map((key) => [key, store.getServerRow(key)!]),
    subsets: [...collection.listSubsets.values()]
      .filter((subset) => subset.hasLoaded)
      .map((subset) => ({
        plan: subset.plan,
        definition: subset.definition,
        // In the order the last load returned, so a restored list without `orderBy` keeps its order
        owned: [...subset.owned].toSorted(
          (left, right) => subset.orderIndex.get(left)! - subset.orderIndex.get(right)!,
        ),
        cursor: subset.cursor,
        hasMore: subset.hasMore,
        pages: subset.pages,
        loadedAt: subset.loadedAt,
      })),
  };
};

/**
 * Writes a snapshot's rows and subsets into a collection. The subsets answer queries at once but count as stale,
 * because events sent since the snapshot was taken were missed, so they refetch when a query mounts.
 */
export const restoreSnapshot = (collection: CollectionRuntime, snapshot: CollectionSnapshot) => {
  collection.db.batch(() => {
    snapshot.rows.forEach(([rowKey, row]) => {
      collection.store.write(rowKey, row, { complete: true, stamp: { kind: "sent", seq: 0, wall: 0 } });
    });
    snapshot.subsets.forEach((stored) => {
      const subset = collection.getListSubset(stored.plan, {
        collection: collection.name,
        orderBy: stored.definition.orderBy,
        limit: stored.definition.limit,
        local: false,
      });
      stored.owned.forEach((ownedKey, index) => {
        subset.owned.add(ownedKey);
        subset.orderIndex.set(ownedKey, index);
      });
      subset.cursor = stored.cursor;
      subset.hasMore = stored.hasMore;
      subset.pages = stored.pages;
      subset.hasLoaded = true;
      subset.loadedAt = stored.loadedAt;
      subset.invalidated = true;
      subset.notify();
    });
  });
};
