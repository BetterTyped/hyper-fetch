import { createClient, Time } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type ProductSummary = { id: number; title: string; price: number };
export type Product = ProductSummary & {
  description: string;
  brand?: string;
  rating: number;
  stock: number;
};

const getProducts = client.createRequest<{
  response: { products: ProductSummary[] };
  queryParams: { limit: number; select: string };
}>()({
  endpoint: "/products",
  staleTime: Time.MIN,
});

const getProduct = client.createRequest<{
  response: Product;
  // `delay` slows dummyjson down, so a prefetched product and a cold one are easy to tell apart.
  queryParams: { select: string; delay: number };
}>()({
  endpoint: "/products/:productId",
  // A prefetched product stays fresh for a minute, so opening it does not request it again.
  staleTime: Time.MIN,
});

// Loaders and components build the requests with these functions, so they share one cache key.
export const productList = getProducts.setQueryParams({
  limit: 12,
  select: "title,price",
});
export const productDetails = (productId: number) =>
  getProduct.setParams({ productId }).setQueryParams({
    select: "title,price,description,brand,rating,stock",
    delay: 800,
  });

// A tiny log of the requests that reach the network, to show which ones the hover prefetch already made.
let networkLog: string[] = [];
const listeners = new Set<() => void>();
client.onRequest((request) => {
  networkLog = [`${new Date().toLocaleTimeString()} ${request.method} ${request.endpoint}`, ...networkLog].slice(0, 6);
  listeners.forEach((listener) => listener());
  return request;
});
export const getNetworkLog = () => networkLog;
export const subscribeNetworkLog = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
