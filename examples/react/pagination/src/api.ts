import { createClient, Time } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export const PAGE_SIZE = 8;

export type Product = { id: number; title: string; category: string; price: number; rating: number };

/** `staleTime` keeps a page fresh for a minute, so a cached or prefetched page is not requested again. */
export const getProducts = client.createRequest<{
  response: { products: Product[]; total: number };
  queryParams: { limit: number; skip: number; select: string };
}>()({
  endpoint: "/products",
  staleTime: Time.MIN,
});

/**
 * The query params are part of the cache key, so every page is cached on its own.
 * The hook and the prefetch call build the request the same way and share the cache entry.
 */
export const getProductsPage = (page: number) =>
  getProducts.setQueryParams({
    limit: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
    select: "title,category,price,rating",
  });
