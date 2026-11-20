import { useFetch } from "@hyper-fetch/react";
import { useState } from "react";

import { getProductRequest, getProductsRequest } from "./api";
import type { Product } from "./api";

/** A product that is not in the list, so there is nothing to show before its response arrives. */
const UNLISTED_ID = 42;

const ProductDetails = ({ productId, placeholder }: { productId: number; placeholder?: Product }) => {
  // `initialResponse` is shown while the cache is empty. The request is still sent, and its response replaces it.
  const { data, error, loading } = useFetch(getProductRequest.setParams({ productId }), {
    initialResponse: placeholder ? { data: placeholder } : null,
  });

  if (error) return <article>Could not load the product: {error.message}</article>;
  if (!data) return <article aria-busy="true">Loading product {productId}...</article>;

  return (
    <article>
      <header className="toolbar">
        <strong>{data.title}</strong>
        {loading ? <small aria-busy="true">Waiting for the server</small> : <mark>Server response</mark>}
      </header>
      <img className="thumb" src={data.thumbnail} alt="" />
      <p>{data.description}</p>
      <footer className="muted">
        ${data.price} · {data.rating} / 5 · {data.stock} in stock · {data.category}
      </footer>
    </article>
  );
};

export const App = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const { data, error, loading } = useFetch(getProductsRequest);

  // The list already holds everything the details view needs, so it serves as the initial data.
  const placeholder = data?.products.find((product) => product.id === selected);

  return (
    <main className="container">
      <hgroup>
        <h1>Initial data</h1>
        <p>Open a product. Its details show up at once from the list and are replaced when the server answers.</p>
      </hgroup>
      <div className="grid-2">
        <section>
          {loading && !data && <p aria-busy="true">Loading products...</p>}
          {error && <p>Could not load products: {error.message}</p>}
          <ul className="list">
            {data?.products.map((product) => (
              <li key={product.id}>
                <button
                  type="button"
                  className={product.id === selected ? undefined : "outline secondary"}
                  onClick={() => setSelected(product.id)}
                >
                  {product.title}
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                className={selected === UNLISTED_ID ? undefined : "outline contrast"}
                onClick={() => setSelected(UNLISTED_ID)}
              >
                Product {UNLISTED_ID} (not in the list)
              </button>
            </li>
          </ul>
        </section>
        {selected ? (
          // `key` remounts the details for each product, so every product starts with its own initial data.
          <ProductDetails key={selected} productId={selected} placeholder={placeholder} />
        ) : (
          <p className="muted">No product selected.</p>
        )}
      </div>
    </main>
  );
};
