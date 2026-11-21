import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type Quote = { id: number; quote: string; author: string };

/** `retry: 3` sends the request up to 3 more times after a failure, waiting `retryTime` ms before each one. */
export const getQuoteRequest = client.createRequest<{ response: Quote }>()({
  endpoint: "/quotes/random",
  retry: 3,
  retryTime: 1000,
});

/**
 * dummyjson never fails on purpose, so this request is mocked: the first `failuresLeft` attempts answer 503, the next
 * one answers with a quote. Retries are handled by the dispatcher, so they behave the same with a real failing server.
 */
let failuresLeft = 2;

export const setFailures = (count: number) => {
  failuresLeft = count;
};

const quotes: Quote[] = [
  {
    id: 1,
    quote: "Simplicity is prerequisite for reliability.",
    author: "Edsger W. Dijkstra",
  },
  {
    id: 2,
    quote: "First, solve the problem. Then, write the code.",
    author: "John Johnson",
  },
  {
    id: 3,
    quote: "Make it work, make it right, make it fast.",
    author: "Kent Beck",
  },
];

getQuoteRequest.setMock(
  () => {
    if (failuresLeft > 0) {
      failuresLeft -= 1;
      return { error: new Error("Service unavailable"), status: 503 };
    }
    return {
      data: quotes[Math.floor(Math.random() * quotes.length)],
      status: 200,
    };
  },
  { responseTime: 400 },
);
