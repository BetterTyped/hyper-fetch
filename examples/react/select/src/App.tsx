import { useFetch } from "@hyper-fetch/react";

import { getCart, updateCart } from "./api";
import { useRenderFlash } from "./use-render-flash";

// Each component sends the same request and shares one cache entry. `select` picks the slice it renders.

const ItemCount = () => {
  const ref = useRenderFlash<HTMLElement>();
  const { data: count } = useFetch(getCart, { select: (cart) => cart.totalQuantity });

  return (
    <article ref={ref}>
      <small className="muted">select: totalQuantity</small>
      <h2>{count ?? "-"} items</h2>
    </article>
  );
};

const CartTotal = () => {
  const ref = useRenderFlash<HTMLElement>();
  const { data: total } = useFetch(getCart, { select: (cart) => cart.total });

  return (
    <article ref={ref}>
      <small className="muted">select: total</small>
      <h2>${total?.toFixed(2) ?? "-"}</h2>
    </article>
  );
};

const ItemNames = () => {
  const ref = useRenderFlash<HTMLElement>();
  // A new array on every run, but structural sharing keeps the old reference while the titles are equal.
  const { data: names } = useFetch(getCart, { select: (cart) => cart.products.map((item) => item.title) });

  return (
    <article ref={ref}>
      <small className="muted">select: product titles</small>
      <ul>
        {names?.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </article>
  );
};

const FullCart = () => {
  const ref = useRenderFlash<HTMLElement>();
  // No `select`: the component gets the whole response and re-renders on any change.
  const { data: cart } = useFetch(getCart);

  return (
    <article ref={ref}>
      <small className="muted">no select: the whole cart</small>
      <ul>
        {cart?.products.map((item) => (
          <li key={item.id}>
            {item.quantity} × {item.title}
          </li>
        ))}
      </ul>
    </article>
  );
};

const addOne = () =>
  updateCart((cart) => {
    const [first, ...rest] = cart.products;
    if (!first) return cart;
    return {
      ...cart,
      products: [{ ...first, quantity: first.quantity + 1 }, ...rest],
      totalQuantity: cart.totalQuantity + 1,
      total: cart.total + first.price,
    };
  });

const rename = () =>
  updateCart((cart) => ({
    ...cart,
    products: cart.products.map((item, index) => (index === 0 ? { ...item, title: `${item.title}!` } : item)),
  }));

/** Its own component: when `loading` changes, only the toolbar re-renders, not the cards. */
const Toolbar = () => {
  const { loading, error, refetch } = useFetch(getCart);

  return (
    <>
      <div className="toolbar">
        <button type="button" onClick={addOne}>
          Add one of the first item
        </button>
        <button type="button" className="secondary" onClick={rename}>
          Rename the first item
        </button>
        <button type="button" className="outline secondary" onClick={refetch} aria-busy={loading}>
          Refetch from server
        </button>
      </div>
      {error && <p>Could not load the cart: {error.message}</p>}
    </>
  );
};

export const App = () => (
  <main className="container">
    <hgroup>
      <h1>Select</h1>
      <p>Four components read one cached cart. A card flashes when it re-renders.</p>
    </hgroup>
    <Toolbar />
    <div className="cards">
      <ItemCount />
      <CartTotal />
      <ItemNames />
      <FullCart />
    </div>
  </main>
);
