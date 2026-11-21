import { createClient, Time } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type ProductSummary = { id: number; title: string; price: number };
export type Product = ProductSummary & { description: string; brand?: string; rating: number; images: string[] };

export const getProducts = client.createRequest<{
  response: { products: ProductSummary[] };
  queryParams: { limit: number; select: string };
}>()({
  endpoint: "/products",
});

/** `staleTime` keeps a prefetched product fresh for a minute, so opening it does not request it again. */
export const getProduct = client.createRequest<{
  response: Product;
  // `delay` makes dummyjson slow, so the difference between a prefetched and a cold product is easy to see.
  queryParams: { select: string; delay: number };
}>()({
  endpoint: "/products/:productId",
  staleTime: Time.MIN,
});

/** The hover prefetch and the details view build the request the same way, so they share one cache key. */
export const productDetails = (productId: number) =>
  getProduct
    .setParams({ productId })
    // `select` and `delay` are dummyjson query params: return only these fields, answer after `delay` ms.
    .setQueryParams({ select: "title,price,description,brand,rating,images", delay: 700 });
