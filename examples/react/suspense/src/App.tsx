import { useFetch } from "@hyper-fetch/react";
import { Suspense, useState } from "react";

import { getProduct } from "./api";
import { ErrorBoundary } from "./error-boundary";

const productIds = [1, 2, 3, 999];

const getMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null && "message" in error) return String(error.message);
  return "Unknown error";
};

/** Written as if the data is always there: loading goes to <Suspense>, errors go to the boundary. */
const ProductDetails = ({ productId }: { productId: number }) => {
  const { data } = useFetch(
    getProduct
      .setParams({ productId })
      // `select` and `delay` are dummyjson query params: return only these fields, answer after `delay` ms.
      .setQueryParams({ select: "title,description,price,rating,thumbnail", delay: 800 }),
    { suspense: true, throwOnError: true },
  );

  // The type stays nullable because the same hook works without suspense. With it, data is set by now.
  if (!data) return null;

  return (
    <article className="product">
      <img src={data.thumbnail} alt="" width={120} height={120} />
      <div>
        <h3>{data.title}</h3>
        <p>{data.description}</p>
        <small className="muted">
          ${data.price} · rated {data.rating}
        </small>
      </div>
    </article>
  );
};

export const App = () => {
  const [productId, setProductId] = useState(1);

  return (
    <main className="container">
      <hgroup>
        <h1>Suspense</h1>
        <p>Products you opened before show at once from the cache. Product 999 does not exist.</p>
      </hgroup>

      <div role="group">
        {productIds.map((id) => (
          <button
            key={id}
            type="button"
            className={id === productId ? undefined : "outline secondary"}
            onClick={() => setProductId(id)}
          >
            Product {id}
          </button>
        ))}
      </div>

      {/* `key` gives every product a fresh boundary, so an error does not stick after switching. */}
      <ErrorBoundary
        key={productId}
        fallback={({ error, reset }) => (
          <article className="error">
            <h3>Could not load product {productId}</h3>
            <p className="muted">{getMessage(error)}</p>
            <button type="button" onClick={reset}>
              Try again
            </button>
          </article>
        )}
      >
        <Suspense fallback={<article aria-busy="true">Loading product {productId}...</article>}>
          <ProductDetails productId={productId} />
        </Suspense>
      </ErrorBoundary>
    </main>
  );
};
