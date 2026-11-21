import { useFetch } from "@hyper-fetch/react";
import type { FormEvent } from "react";

import { searchProductsRequest } from "./api";
import { toOrder, toSortBy, useUrlFilters } from "./url-state";

const pageSize = 8;

export const App = () => {
  const [filters, setFilters] = useUrlFilters();

  // Each combination of filters has its own cache key, so going back shows the earlier page at once.
  const { data, error, loading } = useFetch(
    searchProductsRequest.setQueryParams({
      q: filters.q,
      sortBy: filters.sortBy,
      order: filters.order,
      limit: pageSize,
      skip: (filters.page - 1) * pageSize,
      // `select` is a dummyjson query param: the API returns only these fields.
      select: "title,price,rating,category",
    }),
  );

  const pages = data ? Math.max(Math.ceil(data.total / pageSize), 1) : 1;

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters({ q: String(new FormData(event.currentTarget).get("q") ?? "").trim() });
  };

  return (
    <main className="container">
      <hgroup>
        <h1>Products</h1>
        <p>
          Filters live in the URL: <code>{window.location.search || "(no query string)"}</code>. Copy the link or use
          the back button.
        </p>
      </hgroup>

      <div className="filters">
        {/* `key` resets the input when back/forward changes the search term. */}
        <form role="search" onSubmit={handleSearch} key={filters.q}>
          <input name="q" type="search" defaultValue={filters.q} placeholder="Search products" aria-label="Search" />
          <button type="submit">Search</button>
        </form>
        <select
          aria-label="Sort by"
          value={filters.sortBy}
          onChange={(event) => setFilters({ sortBy: toSortBy(event.target.value) })}
        >
          <option value="title">Sort by title</option>
          <option value="price">Sort by price</option>
          <option value="rating">Sort by rating</option>
        </select>
        <select
          aria-label="Order"
          value={filters.order}
          onChange={(event) => setFilters({ order: toOrder(event.target.value) })}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

      {error && <p className="error">Could not load products: {error.message}</p>}
      {!data && loading && <p aria-busy="true">Loading products...</p>}

      {data && (
        <table aria-busy={loading}>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            {data.products.map((product) => (
              <tr key={product.id}>
                <td>{product.title}</td>
                <td>{product.category}</td>
                <td>${product.price}</td>
                <td>{product.rating}</td>
              </tr>
            ))}
            {data.products.length === 0 && (
              <tr>
                <td colSpan={4}>No products match "{filters.q}".</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <nav className="pager">
        <button
          type="button"
          className="outline"
          disabled={filters.page <= 1}
          onClick={() => setFilters({ page: filters.page - 1 })}
        >
          Previous
        </button>
        <span>
          Page {filters.page} of {pages}
        </span>
        <button
          type="button"
          className="outline"
          disabled={filters.page >= pages}
          onClick={() => setFilters({ page: filters.page + 1 })}
        >
          Next
        </button>
      </nav>
    </main>
  );
};
