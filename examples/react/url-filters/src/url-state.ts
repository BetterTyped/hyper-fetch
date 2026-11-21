import { useEffect, useState } from "react";

import type { Order, SortBy } from "./api";

export type Filters = { q: string; sortBy: SortBy; order: Order; page: number };

const defaults: Filters = { q: "", sortBy: "title", order: "asc", page: 1 };
const filterKeys: (keyof Filters)[] = ["q", "sortBy", "order", "page"];
const sortOptions: SortBy[] = ["title", "price", "rating"];

/** Turn any string into a valid option. Used for the URL and for the select elements. */
export const toSortBy = (value: string | null): SortBy =>
  sortOptions.find((option) => option === value) ?? defaults.sortBy;
export const toOrder = (value: string | null): Order => (value === "desc" ? "desc" : "asc");

/** The URL is user input. Unknown values fall back to the defaults, so the request always gets valid params. */
const readFilters = (): Filters => {
  const params = new URLSearchParams(window.location.search);
  const page = Number(params.get("page"));

  return {
    q: params.get("q") ?? defaults.q,
    sortBy: toSortBy(params.get("sortBy")),
    order: toOrder(params.get("order")),
    page: Number.isInteger(page) && page > 0 ? page : defaults.page,
  };
};

/** Default values are left out, so the URL stays short: `?q=phone&page=2`. */
const writeFilters = (filters: Filters) => {
  const params = new URLSearchParams();
  filterKeys.forEach((key) => {
    if (filters[key] !== defaults[key]) params.set(key, String(filters[key]));
  });
  const search = params.toString();
  window.history.pushState(null, "", search ? `?${search}` : window.location.pathname);
};

/** Filters live in the URL. Every change is a history entry, and back/forward restores the filters. */
export const useUrlFilters = () => {
  const [filters, setFilters] = useState(readFilters);

  useEffect(() => {
    const handlePopState = () => setFilters(readFilters());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const update = (changes: Partial<Filters>) => {
    // Any change other than the page starts again from page 1.
    const next = { ...filters, page: 1, ...changes };
    writeFilters(next);
    setFilters(next);
  };

  return [filters, update] as const;
};
