import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type Product = { id: number; title: string; price: number; rating: number; category: string };
export type SortBy = "title" | "price" | "rating";
export type Order = "asc" | "desc";

/** Typed query params: the filters read from the URL must fit this shape before they reach the request. */
export const searchProductsRequest = client.createRequest<{
  response: { products: Product[]; total: number; skip: number; limit: number };
  queryParams: { q: string; sortBy: SortBy; order: Order; limit: number; skip: number; select: string };
}>()({ endpoint: "/products/search" });
