import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type Quote = { id: number; quote: string; author: string };

/** Returns a different quote on every call, so each poll is visible. */
export const getRandomQuote = client.createRequest<{ response: Quote }>()({
  endpoint: "/quotes/random",
});
