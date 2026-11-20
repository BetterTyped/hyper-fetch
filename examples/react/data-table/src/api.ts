import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type Product = { id: number; title: string; category: string; price: number; rating: number; stock: number };
export type SortKey = "title" | "category" | "price" | "rating" | "stock";
export type Order = "asc" | "desc";

/** The server sorts, filters and pages. The table only sends the state of its controls as typed query params. */
export const searchProductsRequest = client.createRequest<{
  response: { products: Product[]; total: number; skip: number; limit: number };
  queryParams: { q: string; sortBy: SortKey; order: Order; limit: number; skip: number; select: string };
}>()({ endpoint: "/products/search" });
