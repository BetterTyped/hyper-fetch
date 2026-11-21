import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

type Product = { id: number; title: string };

/**
 * `cancelable: true` aborts the running request of the same queue when a new one starts.
 * Every search term has its own query params, so a fixed `queryKey` puts all searches in one queue.
 * `delay` makes dummyjson answer after 1.5 s, which leaves time to type the next letter.
 */
export const searchProductsRequest = client.createRequest<{
  response: { products: Product[]; total: number };
  queryParams: { q: string; select: string; limit: number; delay: number };
}>()({
  endpoint: "/products/search",
  cancelable: true,
  queryKey: "product-search",
});

export type SearchRequest = typeof searchProductsRequest;
