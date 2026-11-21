import { createClient } from "@hyper-fetch/core";

/** One client for the server and the browser. On the server it runs in server mode and keeps no shared cache. */
export const client = createClient({ url: "https://dummyjson.com" });

export type Post = {
  id: number;
  title: string;
  body: string;
  views: number;
  tags: string[];
};

const getPosts = client.createRequest<{
  response: { posts: Post[] };
  queryParams: { limit: number; select: string };
}>()({
  endpoint: "/posts",
});

/** `getServerSideProps` and the page component must use the same request, so the cache keys match. */
export const latestPosts = getPosts.setQueryParams({
  limit: 6,
  // `select` is a dummyjson query param: the API returns only these fields.
  select: "title,views,tags",
});

export const getPost = client.createRequest<{ response: Post }>()({
  endpoint: "/posts/:postId",
});
