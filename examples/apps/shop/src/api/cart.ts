import { Time } from "@hyper-fetch/core";

import { client } from "./client";
import type { ProductSummary } from "./products";

export type CartLine = Pick<ProductSummary, "id" | "title" | "price" | "thumbnail"> & { quantity: number };
export type Cart = {
  id: number;
  products: CartLine[];
  totalQuantity: number;
  /** Prices are the server's: the client never computes the total it charges. */
  total: number;
  discountedTotal: number;
};

/** The signed-in user's cart. dummyjson has a few, number 2 is a short one. */
const CART_ID = 2;

export const getCart = client
  .createRequest<{ response: Cart }>()({
    endpoint: "/carts/:cartId",
    // dummyjson does not store cart changes, so the app treats the saved cart as the truth and keeps it for a week.
    // With a real API, use a short `staleTime` and let it refetch.
    staleTime: Time.WEEK,
    cacheTime: Time.WEEK,
  })
  .setParams({ cartId: CART_ID });

/**
 * dummyjson prices the products it receives. `merge: false` replaces the whole cart, so every save sends all lines
 * and the answer has the totals for exactly that cart.
 */
export const saveCart = client
  .createRequest<{
    response: Cart;
    payload: { merge: false; products: Pick<CartLine, "id" | "quantity">[] };
  }>()({
    endpoint: "/carts/:cartId",
    method: "PUT",
    cache: false,
    // Saves go out one by one, so the last answer is always for the latest cart.
    queued: true,
  })
  .setParams({ cartId: CART_ID });

/** Adds `delta` (or removes, when negative) of a product. Lines that drop to zero leave the cart. */
export const changeQuantity = (cart: Cart, product: Omit<CartLine, "quantity">, delta: number): Cart => {
  const exists = cart.products.some((line) => line.id === product.id);
  const lines = exists
    ? cart.products.map((line) => (line.id === product.id ? { ...line, quantity: line.quantity + delta } : line))
    : [...cart.products, { ...product, quantity: delta }];
  const products = lines.filter((line) => line.quantity > 0);

  return { ...cart, products, totalQuantity: products.reduce((sum, line) => sum + line.quantity, 0) };
};

export const toPayload = (cart: Cart) => ({
  merge: false as const,
  products: cart.products.map(({ id, quantity }) => ({ id, quantity })),
});
