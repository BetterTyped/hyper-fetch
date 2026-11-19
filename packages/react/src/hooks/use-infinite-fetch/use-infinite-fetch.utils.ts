import type { RequestInstance } from "@hyper-fetch/core";

import type { InfiniteSnapshot } from "./use-infinite-fetch.store.types";

/**
 * Identity of a list. Everything describing the request takes part in it, so a changed filter, sort, page size
 * or URL param starts a new list without anything having to be listed by hand.
 */
export const getInfiniteKey = (request: RequestInstance, pagination: unknown, maxPages?: number) => {
  return JSON.stringify([request.toJSON(), pagination, maxPages ?? null], (_key, value) => {
    return typeof value === "function" ? value.toString() : value;
  });
};

/**
 * Keeps the first occurrence of every item
 */
export const getUniqueItems = (items: unknown[], uniqueBy: unknown) => {
  if (uniqueBy === undefined) {
    return items;
  }

  const seen = new Set<unknown>();
  return items.filter((item: any) => {
    const identity = typeof uniqueBy === "function" ? uniqueBy({ item }) : item?.[uniqueBy as string];
    if (seen.has(identity)) {
      return false;
    }
    seen.add(identity);
    return true;
  });
};

/**
 * Decides if the previous list stays on screen while the new one loads its first page
 */
export const getShouldKeepPreviousList = (
  mode: "auto" | "preserve" | "clean",
  previous: RequestInstance,
  current: RequestInstance,
) => {
  if (mode === "auto") {
    return previous.method === current.method && previous.endpoint === current.endpoint;
  }
  return mode === "preserve";
};

/**
 * Tells whether nothing changed between two states of a list, so nobody has to be notified
 */
export const isSameSnapshot = (a: InfiniteSnapshot, b: InfiniteSnapshot) => {
  return (Object.keys(a) as (keyof InfiniteSnapshot)[]).every((key) => a[key] === b[key]);
};
