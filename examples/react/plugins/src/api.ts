import { createClient } from "@hyper-fetch/core";

import { loggerPlugin, metricsPlugin } from "./plugins";

export const logger = loggerPlugin();

// Plugins see every request of the client. The requests below know nothing about logging or metrics.
export const client = createClient({ url: "https://dummyjson.com" }).addPlugin(logger).addPlugin(metricsPlugin());

export const getPost = client.createRequest<{ response: { id: number; title: string } }>()({
  endpoint: "/posts/:postId",
});

export const getSlowProducts = client.createRequest<{
  response: { products: unknown[] };
  queryParams: { delay: number };
}>()({
  endpoint: "/products",
});

export const getBroken = client.createRequest<{ response: never }>()({
  endpoint: "/http/:status",
});

/** One button per call. Some are slow, some fail, so the metrics have something to show. */
export const calls = {
  "Random post": () => getPost.send({ params: { postId: Math.ceil(Math.random() * 30) } }),
  "Slow products": () => getSlowProducts.send({ queryParams: { delay: 800 + Math.round(Math.random() * 800) } }),
  "500 error": () => getBroken.send({ params: { status: 500 } }),
};
