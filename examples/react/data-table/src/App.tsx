import { useFetch } from "@hyper-fetch/react";
import { useState } from "react";

import { searchProductsRequest } from "./api";
import type { Order, SortKey } from "./api";

const columns: { key: SortKey; label: string }[] = [
  { key: "title", label: "Product" },
  { key: "category", label: "Category" },
  { key: "price", label: "Price" },
  { key: "rating", label: "Rating" },
  { key: "stock", label: "Stock" },
];

export const App = () => {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; order: Order }>({ key: "title", order: "asc" });
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(0);

  const { data, error, loading } = useFetch(
    searchProductsRequest.setQueryParams({
      q: query,
      sortBy: sort.key,
      order: sort.order,
      limit: pageSize,
      skip: page * pageSize,
      select: columns.map((column) => column.key).join(","),
    }),
    {
      // The old rows stay on screen until the new ones arrive, so the table does not flash empty.
      keepPreviousData: "preserve",
      // Typing in the search box changes the request on every key. Wait until the user pauses.
      bounce: true,
      bounceTime: 300,
    },
  );

  const pages = data ? Math.max(Math.ceil(data.total / pageSize), 1) : 1;

  const toggleSort = (key: SortKey) => {
    setSort((current) => ({ key, order: current.key === key && current.order === "asc" ? "desc" : "asc" }));
    setPage(0);
  };

  return (
    <main className="container">
      <hgroup>
        <h1>Products</h1>
        <p>Sorting, search and paging happen on the server. Click a column header to sort.</p>
      </hgroup>

      <div className="controls">
        <input
          type="search"
          placeholder="Search products"
          aria-label="Search products"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(0);
          }}
        />
        <select
          aria-label="Rows per page"
          value={pageSize}
          onChange={(event) => {
            setPageSize(Number(event.target.value));
            setPage(0);
          }}
        >
          {[5, 10, 20].map((size) => (
            <option key={size} value={size}>
              {size} rows
            </option>
          ))}
        </select>
      </div>

      {error && <p className="error">Could not load products: {error.message}</p>}

      <div className="table-wrapper">
        <table className={loading && data ? "stale" : undefined} aria-busy={loading}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  aria-sort={sort.key === column.key ? (sort.order === "asc" ? "ascending" : "descending") : undefined}
                >
                  <button type="button" className="sort" onClick={() => toggleSort(column.key)}>
                    {column.label} {sort.key === column.key ? (sort.order === "asc" ? "▲" : "▼") : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!data && loading && (
              <tr>
                <td colSpan={columns.length} aria-busy="true">
                  Loading products...
                </td>
              </tr>
            )}
            {data?.products.map((product) => (
              <tr key={product.id}>
                <td>{product.title}</td>
                <td>{product.category}</td>
                <td>${product.price}</td>
                <td>{product.rating}</td>
                <td>{product.stock}</td>
              </tr>
            ))}
            {data?.products.length === 0 && (
              <tr>
                <td colSpan={columns.length}>No products match "{query}".</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <nav className="pager">
        <button type="button" className="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>
          Previous
        </button>
        <span>
          Page {page + 1} of {pages} · {data?.total ?? 0} products {loading && <small aria-busy="true" />}
        </span>
        <button type="button" className="outline" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>
          Next
        </button>
      </nav>
    </main>
  );
};
