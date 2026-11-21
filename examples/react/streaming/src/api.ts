import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://httpbin.org" });

/**
 * `/drip` sends `numbytes` bytes spread over `duration` seconds, a few at a time - the same shape as an LLM answer
 * streamed token by token. The response type is the body text; `useStream` reads the body as a stream instead.
 */
export const getDrip = client.createRequest<{
  response: string;
  queryParams: { numbytes: number; duration: number; delay: number };
}>()({
  endpoint: "/drip",
});
