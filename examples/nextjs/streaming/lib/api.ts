import { createClient } from "@hyper-fetch/core";

/** One client for the server and the browser. On the server it runs in server mode and keeps no shared cache. */
export const client = createClient({ url: "https://dummyjson.com" });

export type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  company: { title: string };
};
export type Post = { id: number; title: string; views: number };
export type Product = {
  id: number;
  title: string;
  price: number;
  rating: number;
};

// `delay` makes dummyjson answer slowly, so each section streams in at a different time.
export const currentUser = client
  .createRequest<{
    response: User;
    queryParams: { delay: number; select: string };
  }>()({ endpoint: "/users/1" })
  // `select` and `delay` are dummyjson query params: return only these fields, answer after `delay` ms.
  .setQueryParams({ delay: 300, select: "firstName,lastName,email,company" });

export const latestPosts = client
  .createRequest<{
    response: { posts: Post[] };
    queryParams: { delay: number; limit: number; select: string };
  }>()({
    endpoint: "/posts",
  })
  .setQueryParams({ delay: 1500, limit: 4, select: "title,views" });

export const topProducts = client
  .createRequest<{
    response: { products: Product[] };
    queryParams: {
      delay: number;
      limit: number;
      select: string;
      sortBy: string;
      order: string;
    };
  }>()({ endpoint: "/products" })
  .setQueryParams({
    delay: 3000,
    limit: 4,
    select: "title,price,rating",
    sortBy: "rating",
    order: "desc",
  });
