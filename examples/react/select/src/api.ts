import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type CartItem = { id: number; title: string; price: number; quantity: number; thumbnail: string };

export type Cart = {
  id: number;
  products: CartItem[];
  total: number;
  totalProducts: number;
  totalQuantity: number;
};

/** One request, one cache entry. Every component below reads its own slice of it. */
export const getCart = client.createRequest<{ response: Cart }>()({
  endpoint: "/carts/1",
});

/**
 * Changes the cached cart in place, the way a mutation or a realtime event would.
 * Every hook that reads `getCart` gets the new data, and `select` decides which of them re-render.
 */
export const updateCart = (change: (cart: Cart) => Cart) => {
  client.cache.update(getCart, (cached) => (cached?.data ? { data: change(cached.data) } : {}));
};
