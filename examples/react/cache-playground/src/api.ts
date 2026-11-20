import { Time, createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type Post = { id: number; title: string; body: string };

/** The options a reader can change in the playground. Times are in seconds. */
export type Settings = {
  staleTime: number;
  cacheTime: number;
  retry: number;
  revalidate: boolean;
  refetchOnFocus: boolean;
};

export const defaultSettings: Settings = {
  staleTime: 10,
  cacheTime: 30,
  retry: 2,
  revalidate: false,
  refetchOnFocus: true,
};

/** The base request. `staleTime`, `cacheTime` and `retry` are set from the controls in `App.tsx`. */
export const getPostRequest = client.createRequest<{ response: Post }>()({
  endpoint: "/posts/:postId",
  retryTime: Time.SEC,
});

/** Builds the request for one post with the current settings. Setters return a new request with the same cache key. */
export const getPostWithSettings = (postId: number, settings: Settings) =>
  getPostRequest
    .setParams({ postId })
    .setStaleTime(settings.staleTime * Time.SEC)
    .setCacheTime(settings.cacheTime * Time.SEC)
    .setRetry(settings.retry);

/** dummyjson never fails on purpose. While the switch is on, this mock answers 500 instead of the network. */
getPostRequest
  .setMock(() => ({ error: new Error("Simulated server error"), status: 500 }), { responseTime: 300 })
  .setMockingEnabled(false);

export const setFailRequests = (fail: boolean) => {
  getPostRequest.setMockingEnabled(fail);
};
