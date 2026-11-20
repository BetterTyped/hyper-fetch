import { createClient } from "@hyper-fetch/core";
import type { Pagination } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type Product = { id: number; title: string; brand?: string; price: number; thumbnail: string };

export const getProducts = client.createRequest<{
  response: { products: Product[]; total: number; skip: number; limit: number };
  queryParams: { limit: number; skip?: number; select: string };
}>()({
  endpoint: "/products",
});

/**
 * dummyjson pages with `skip` and `limit`. Every key is checked against the request types:
 * a typo in "skip" or "products" is a compile error.
 */
export const productsPagination = {
  offset: "skip",
  limit: "limit",
  items: "products",
  total: "total",
} satisfies Pagination<typeof getProducts>;
