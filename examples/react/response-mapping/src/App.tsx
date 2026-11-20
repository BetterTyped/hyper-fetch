import { useFetch } from "@hyper-fetch/react";
import { useState } from "react";
import { z } from "zod";

import { FIELDS, getProducts, type Product } from "./api";

const ProductCard = ({ product }: { product: Product }) => (
  <article className="product">
    <img src={product.image} alt="" width={96} height={96} />
    <div>
      <strong>{product.name}</strong>
      <p>
        <del className="muted">${product.price.toFixed(2)}</del> <ins>${product.salePrice.toFixed(2)}</ins>
      </p>
      <small>{product.inStock ? "In stock" : <mark>Sold out</mark>}</small>
    </div>
  </article>
);

const ValidationError = ({ error }: { error: Error }) => {
  // The mapper returns the ZodError as the response error, so it can be told apart from network errors.
  if (!(error instanceof z.ZodError)) return <p className="error">Could not load products: {error.message}</p>;

  const issues = [...new Set(error.issues.map((issue) => `${issue.path.at(-1)?.toString()}: ${issue.message}`))];

  return (
    <article>
      <header>
        <strong className="error">The API returned data the app does not understand</strong>
      </header>
      <p>The response mapper rejected it, so no component received broken data. Issues:</p>
      <ul>
        {issues.map((issue) => (
          <li key={issue}>
            <code>{issue}</code>
          </li>
        ))}
      </ul>
    </article>
  );
};

export const App = () => {
  const [broken, setBroken] = useState(false);

  // `data` already has the app shape: `name`, `salePrice` and `inStock` come from the mapper, not from the API.
  const { data, error, loading } = useFetch(
    getProducts.setQueryParams({ limit: 6, select: broken ? "title,thumbnail" : FIELDS }),
  );

  return (
    <main className="container">
      <hgroup>
        <h1>Products</h1>
        <p>The API response is validated with zod and mapped to the app shape before any component sees it.</p>
      </hgroup>
      <label>
        <input type="checkbox" role="switch" checked={broken} onChange={(event) => setBroken(event.target.checked)} />
        Simulate a breaking API change (the response loses <code>price</code>, <code>stock</code> and{" "}
        <code>discountPercentage</code>)
      </label>
      {loading && !data && !error && <p aria-busy="true">Loading products...</p>}
      {error && <ValidationError error={error} />}
      {data && !error && (
        <section>
          <p className="muted">
            Showing {data.items.length} of {data.total} products
          </p>
          <div className="products">
            {data.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
};
