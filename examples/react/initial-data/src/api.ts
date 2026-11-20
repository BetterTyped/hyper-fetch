import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type Product = {
  id: number;
  title: string;
  price: number;
  thumbnail: string;
  description: string;
  rating: number;
  stock: number;
  category: string;
};

/** Both requests select the same fields, so a list item has the full shape of the details response. */
const select = "title,price,thumbnail,description,rating,stock,category";

export const getProductsRequest = client
  .createRequest<{
    response: { products: Product[] };
    queryParams: { limit: number; select: string };
  }>()({
    endpoint: "/products",
  })
  .setQueryParams({ limit: 6, select });

/** `delay` keeps the details request slow, so you can see the initial data before the response replaces it. */
export const getProductRequest = client
  .createRequest<{
    response: Product;
    queryParams: { select: string; delay: number };
  }>()({
    endpoint: "/products/:productId",
  })
  .setQueryParams({ select, delay: 1500 });
