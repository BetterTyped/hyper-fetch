import { useCache, useFetch } from "@hyper-fetch/react";

import { getCartRequest, getProductsRequest } from "./api";
import { addToCart, removeFromCart } from "./cart";

/** Far away from the cart panel, no props or context. It reads the cart's cache entry and never sends a request. */
const CartBadge = () => {
  // `select` re-renders the badge only when the number changes, not on every cart update.
  const { data: count } = useCache(getCartRequest, { select: (cart) => cart.totalQuantity });

  return (
    <span className="badge" aria-label="Items in cart">
      Cart {count ?? 0}
    </span>
  );
};

const Header = () => (
  <nav>
    <ul>
      <li>
        <strong>Shop</strong>
      </li>
    </ul>
    <ul>
      <li>
        <CartBadge />
      </li>
    </ul>
  </nav>
);

const ProductGrid = () => {
  const { data, error, loading } = useFetch(getProductsRequest);

  if (loading && !data) return <p aria-busy="true">Loading products...</p>;
  if (error) return <p className="error">Could not load products: {error.message}</p>;

  return (
    <div className="products">
      {data?.products.map((product) => (
        <article key={product.id}>
          <img src={product.thumbnail} alt="" width={96} height={96} loading="lazy" />
          <p>{product.title}</p>
          <footer className="toolbar">
            <strong>${product.price}</strong>
            <button type="button" onClick={() => addToCart(product)}>
              Add
            </button>
          </footer>
        </article>
      ))}
    </div>
  );
};

/** The only component that fetches the cart. The badge above reads the same cache entry. */
const CartPanel = () => {
  const { data, error, loading } = useFetch(getCartRequest);

  if (loading && !data) return <article aria-busy="true">Loading cart...</article>;
  if (error) return <article className="error">Could not load the cart: {error.message}</article>;

  return (
    <article>
      <header>
        <strong>Your cart</strong>
      </header>
      <ul className="cart">
        {data?.products.map((item) => (
          <li key={item.id}>
            <span>
              {item.quantity} x {item.title}
            </span>
            <button type="button" className="outline secondary" onClick={() => removeFromCart(item.id)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <footer className="toolbar">
        <span>{data?.totalQuantity} items</span>
        <strong>${data?.total}</strong>
      </footer>
    </article>
  );
};

export const App = () => (
  <>
    <header className="container">
      <Header />
    </header>
    <main className="container">
      <hgroup>
        <h1>Shared state</h1>
        <p>The header badge, the products and the cart share no props. They all read and write one cache entry.</p>
      </hgroup>
      <div className="grid-2">
        <ProductGrid />
        <CartPanel />
      </div>
    </main>
  </>
);
