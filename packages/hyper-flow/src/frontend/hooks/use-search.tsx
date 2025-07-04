import { useState } from "react";
import { matchSorter, MatchSorterOptions } from "match-sorter";
import { useDebounce } from "@better-hooks/performance";
import { useDidUpdate } from "@better-hooks/lifecycle";

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

export const useSearch = <T extends Array<Record<string, any>>>({
  data,
  searchKeys,
  searchTerm,
  dependencies,
  ...options
}: {
  data: T;
  searchKeys: Array<PathsOf<T[0]>>;
  searchTerm: string;
  dependencies?: readonly any[];
} & Omit<MatchSorterOptions<T[0]>, "keys">) => {
  const [filteredData, setFilteredData] = useState<T>(data as unknown as T);
  const { debounce } = useDebounce({ delay: 200 });

  const handleMatchSorter = () => {
    const filtered = matchSorter(data as readonly T[], searchTerm, {
      ...options,
      keys: searchKeys,
    }) as T;

    setFilteredData(filtered);
  };

  const handleSearch = () => {
    if (!searchTerm && data !== filteredData) {
      setFilteredData(data);
      return;
    }

    handleMatchSorter();
  };

  useDidUpdate(
    () => {
      handleSearch();
    },
    [data],
    true,
  );

  useDidUpdate(() => {
    debounce(handleSearch);
  }, [searchTerm]);

  useDidUpdate(
    () => {
      debounce(handleMatchSorter);
    },
    dependencies ? [...dependencies] : [],
  );

  return { items: filteredData };
};
