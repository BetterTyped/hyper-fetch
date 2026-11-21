import { useFetch } from "@hyper-fetch/react";

import { getCategories } from "../../api/products";

type CategoriesProps = { selected: string | null; onSelect: (category: string | null) => void };

export const Categories = ({ selected, onSelect }: CategoriesProps) => {
  // Categories rarely change: `staleTime` on the request is an hour, so this reads the cache on every visit.
  const { data, error } = useFetch(getCategories, { revalidate: false });

  return (
    <select
      value={selected ?? ""}
      onChange={(event) => onSelect(event.target.value || null)}
      aria-label="Category"
      aria-invalid={error ? true : undefined}
      aria-busy={!data && !error}
    >
      <option value="">{error ? "Categories unavailable" : "All categories"}</option>
      {data?.map((category) => (
        <option key={category.slug} value={category.slug}>
          {category.name}
        </option>
      ))}
    </select>
  );
};
