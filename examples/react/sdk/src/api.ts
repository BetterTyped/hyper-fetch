import type { RequestModel } from "@hyper-fetch/core";
import { createClient, createSdk } from "@hyper-fetch/core";

export type Post = {
  id: number;
  title: string;
  body: string;
  userId: number;
  reactions: { likes: number; dislikes: number };
};

export type NewPost = Pick<Post, "title" | "body" | "userId">;

/**
 * The schema mirrors the URL tree. Plain keys are path segments, `$postId` is the `:postId` param,
 * and `$get` / `$post` are the HTTP methods. Each leaf types one endpoint with `RequestModel`.
 */
type DummyJsonSchema = {
  posts: {
    $get: RequestModel<{
      response: { posts: Pick<Post, "id" | "title">[]; total: number };
      queryParams: { limit: number; select: string };
      endpoint: "/posts";
    }>;
    add: {
      $post: RequestModel<{ response: Post; payload: NewPost; endpoint: "/posts/add" }>;
    };
    $postId: {
      $get: RequestModel<{ response: Post; endpoint: "/posts/:postId" }>;
    };
  };
};

export const client = createClient({ url: "https://dummyjson.com" });

/** No request is created up front. Reading `sdk.posts.$postId.$get` builds a `GET /posts/:postId` request. */
export const sdk = createSdk<typeof client, DummyJsonSchema>(client);
