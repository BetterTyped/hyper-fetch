import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type Product = { id: number; title: string; price: number; thumbnail: string };
export type CartItem = { id: number; title: string; price: number; quantity: number; total: number };
export type Cart = { id: number; products: CartItem[]; total: number; totalQuantity: number };

export const getProductsRequest = client
  .createRequest<{ response: { products: Product[] }; queryParams: { limit: number; select: string } }>()({
    endpoint: "/products",
  })
  // `select` is a dummyjson query param: the API returns only these fields.
  .setQueryParams({ limit: 6, select: "title,price,thumbnail" });

/**
 * One cart, one cache key. Every component that uses this request instance shares the same data.
 * The cart is changed in the cache only, so the entry is kept until the page closes (the default is 5 minutes).
 */
export const getCartRequest = client
  .createRequest<{ response: Cart }>()({ endpoint: "/carts/:cartId", cacheTime: Infinity })
  .setParams({ cartId: 1 });
