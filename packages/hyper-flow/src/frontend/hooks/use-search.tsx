import type { MatchSorterOptions } from "match-sorter";
import { matchSorter } from "match-sorter";
import { useMemo } from "react";

type JoinString<K, P, S extends string = "."> = K extends string | number
  ? P extends string | number
    ? `${K}${"" extends P ? "" : S}${P}`
    : never
  : never;

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, ...0[]];

export type PathsOf<T, S extends string = ".", D extends number = 1> = [D] extends [never]
  ? never
  : T extends object
    ? {
        [K in keyof T]-?: K extends string | number ? `${K}` | JoinString<K, PathsOf<T[K], S, Prev[D]>, S> : never;
      }[keyof T]
    : "";

/**
 * Filter (and optionally sort with `baseSort`) a list by a search term.
 * Derived on every render from the latest data, so entries arriving while the user types are never dropped.
 */
export const useSearch = <T extends Record<string, any>[]>({
  data,
  searchKeys,
  searchTerm,
  dependencies = [],
  ...options
}: {
  data: T;
  /** Paths into the items, or functions returning the text to match, e.g. a formatted name */
  searchKeys: (PathsOf<T[0]> | ((item: T[number]) => string))[];
  searchTerm: string;
  /** Extra values the sorting depends on, e.g. the selected sort column */
  dependencies?: readonly unknown[];
} & Omit<MatchSorterOptions<T[0]>, "keys">) => {
  const items = useMemo(() => {
    if (!searchTerm && !options.baseSort) {
      return data;
    }
    return matchSorter(data, searchTerm ?? "", { ...options, keys: searchKeys }) as unknown as T;
    // `options` and `searchKeys` are recreated by callers on every render, `dependencies` stands for them
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, searchTerm, ...dependencies]);

  return { items };
};
