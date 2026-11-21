import { useInfiniteFetch } from "@hyper-fetch/react";
import { Link, useSearchParams } from "react-router";

import { catalogPagination, catalogRequest, getProduct } from "../../api/products";
import { Price } from "../../components/Price";
import { useCart } from "../cart/use-cart";
import { Categories } from "./Categories";
import { useInView } from "./use-in-view";

export const CatalogPage = () => {
  // Filters live in the URL, so a reload or a shared link opens the same list.
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category");
  const { add } = useCart();

  // A new search or category starts a new list from the first page. `bounce` waits until typing stops.
  const { items, total, loading, error, hasNextPage, fetchNextPage, isFetchingNextPage, isFetchNextPageError } =
    useInfiniteFetch(catalogRequest({ q, category }), {
      pagination: catalogPagination,
      bounce: true,
      bounceTime: 400,
    });

  const sentinel = useInView<HTMLDivElement>(() => fetchNextPage(), {
    enabled: hasNextPage && !isFetchingNextPage && !isFetchNextPageError,
    watch: items.length,
  });

  return (
    <>
      <div className="filters">
        <input
          type="search"
          value={q}
          placeholder="Search products"
          aria-label="Search products"
          // dummyjson cannot search inside a category, so a search clears the category.
          onChange={(event) => setSearchParams(event.target.value ? { q: event.target.value } : {}, { replace: true })}
        />
        <Categories selected={category} onSelect={(value) => setSearchParams(value ? { category: value } : {})} />
      </div>

      {error && items.length === 0 && <p className="error">Could not load products: {error.message}</p>}
      {loading && items.length === 0 && <p aria-busy="true">Loading products...</p>}
      {!loading && !error && items.length === 0 && <p className="muted">No products match "{q}".</p>}
      {total !== null && items.length > 0 && (
        <small className="muted">
          Showing {items.length} of {total}
        </small>
      )}

      <ul className="products">
        {items.map((product) => (
          <li key={product.id}>
            <article>
              <Link
                to={`/products/${product.id}`}
                // Starts loading the details while the pointer is on its way.
                onMouseEnter={() =>
                  getProduct.setParams({ productId: product.id }).send({ cachePolicy: "cache-first" })
                }
              >
                <img src={product.thumbnail} alt="" loading="lazy" />
                <strong>{product.title}</strong>
              </Link>
              <footer>
                <Price value={product.price} />
                <button type="button" className="outline" onClick={() => add(product)}>
                  Add
                </button>
              </footer>
            </article>
          </li>
        ))}
      </ul>

      {isFetchNextPageError && (
        <button type="button" className="secondary" onClick={() => fetchNextPage()}>
          Could not load more. Try again
        </button>
      )}
      <div ref={sentinel} aria-busy={isFetchingNextPage} className="sentinel" />
    </>
  );
};
