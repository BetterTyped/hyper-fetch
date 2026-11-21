import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type Product = { id: number; title: string; price: number; thumbnail: string };

export const searchProducts = client.createRequest<{
  response: { products: Product[]; total: number };
  queryParams: { q: string; limit: number; select: string };
}>()({
  endpoint: "/products/search",
});
