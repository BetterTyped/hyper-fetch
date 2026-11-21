import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type Product = {
  id: number;
  title: string;
  description: string;
  price: number;
  rating: number;
  thumbnail: string;
};

/** dummyjson answers an unknown id with `404 { message }`. */
export const getProduct = client.createRequest<{
  response: Product;
  error: { message: string };
  // `delay` slows dummyjson down so the Suspense fallback is easy to see.
  queryParams: { select: string; delay: number };
}>()({
  endpoint: "/products/:productId",
});
