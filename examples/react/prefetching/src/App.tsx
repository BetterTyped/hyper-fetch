import { useFetch } from "@hyper-fetch/react";
import { useEffect, useState } from "react";

import { client, getProducts, productDetails } from "./api";

const ProductDetails = ({ productId }: { productId: number }) => {
  // `revalidate: false`: a fresh cached product renders without asking the server again.
  const { data, error, loading } = useFetch(productDetails(productId), { revalidate: false });

  if (loading && !data) return <article aria-busy="true">Loading product...</article>;
  if (error) return <article>Could not load the product: {error.message}</article>;
  if (!data) return null;

  return (
    <article>
      <header>
        <h3>{data.title}</h3>
        <small className="muted">
          ${data.price} · {data.brand ?? "No brand"} · rated {data.rating}
        </small>
      </header>
      {data.images[0] && <img src={data.images[0]} alt="" className="cover" />}
      <p>{data.description}</p>
    </article>
  );
};

export const App = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const [prefetched, setPrefetched] = useState<number[]>([]);
  const [log, setLog] = useState<string[]>([]);
  // `select` is a dummyjson query param: the API returns only these fields.
  const { data, error, loading } = useFetch(getProducts.setQueryParams({ limit: 10, select: "title,price" }));

  const prefetch = (productId: number) => {
    // Fills the cache in the background. `cache-first` skips the call when the product is cached already.
    productDetails(productId).send({
      cachePolicy: "cache-first",
      onResponse: ({ response }) => {
        if (response.success) setPrefetched((ids) => (ids.includes(productId) ? ids : [...ids, productId]));
      },
    });
  };

  // Log every request that reaches the network.
  useEffect(
    () =>
      client.requestManager.events.onRequestStart(({ request }) => {
        setLog((entries) => [`GET ${request.endpoint}`, ...entries].slice(0, 12));
      }),
    [],
  );

  return (
    <main className="container">
      <hgroup>
        <h1>Prefetching</h1>
        <p>
          Hover a product, then open it. The details are already in the cache. Open one without hovering to compare.
        </p>
      </hgroup>
      <div className="grid-3">
        <section>
          {loading && !data && <p aria-busy="true">Loading products...</p>}
          {error && <p>Could not load products: {error.message}</p>}
          <ul className="list">
            {data?.products.map((product) => (
              <li key={product.id}>
                <button
                  type="button"
                  className={product.id === selected ? undefined : "outline secondary"}
                  onMouseEnter={() => prefetch(product.id)}
                  onFocus={() => prefetch(product.id)}
                  onClick={() => setSelected(product.id)}
                >
                  {product.title}
                  {prefetched.includes(product.id) && <mark>prefetched</mark>}
                </button>
              </li>
            ))}
          </ul>
        </section>
        {selected ? <ProductDetails productId={selected} /> : <p className="muted">No product selected.</p>}
        <article>
          <header>
            <strong>Network requests</strong>
          </header>
          <ul className="log">
            {log.map((entry, index) => (
              <li key={log.length - index}>{entry}</li>
            ))}
          </ul>
        </article>
      </div>
    </main>
  );
};
