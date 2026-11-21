import { client, getCartRequest } from "./api";
import type { Cart, CartItem, Product } from "./api";

const round = (value: number) => Math.round(value * 100) / 100;

/** Rebuilds the totals, so every reader of the cart sees consistent numbers. */
const withTotals = (cart: Cart, products: CartItem[]): Cart => ({
  ...cart,
  products,
  total: round(products.reduce((sum, item) => sum + item.total, 0)),
  totalQuantity: products.reduce((sum, item) => sum + item.quantity, 0),
});

/**
 * Writes to the cache entry of the cart. Every `useFetch` and `useCache` of `getCartRequest` re-renders with it.
 * The cart stays on this device; a real shop would also save it to the server.
 */
const updateCart = (change: (cart: Cart) => Cart) =>
  client.cache.update(getCartRequest, (cached) => (cached?.data ? { data: change(cached.data) } : {}));

export const addToCart = (product: Product) =>
  updateCart((cart) => {
    const existing = cart.products.find((item) => item.id === product.id);
    const products = existing
      ? cart.products.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1, total: round((item.quantity + 1) * item.price) }
            : item,
        )
      : [
          ...cart.products,
          { id: product.id, title: product.title, price: product.price, quantity: 1, total: product.price },
        ];
    return withTotals(cart, products);
  });

export const removeFromCart = (id: number) =>
  updateCart((cart) =>
    withTotals(
      cart,
      cart.products.filter((item) => item.id !== id),
    ),
  );
