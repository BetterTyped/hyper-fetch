import { createClient } from "@hyper-fetch/core";

import { addLog, rateLimiter } from "./server";

/** Waits longer than this are not worth it. The 429 goes to the caller instead. */
const MAX_WAIT_SECONDS = 10;

/** `Retry-After` is either seconds ("5") or an HTTP date. */
const parseRetryAfter = (value: string | undefined) => {
  if (!value) return null;
  const seconds = Number(value);
  if (!Number.isNaN(seconds)) return seconds;
  const date = Date.parse(value);
  return Number.isNaN(date) ? null : Math.max(0, (date - Date.now()) / 1000);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const client = createClient({ url: "https://dummyjson.com" }).onError(async (response, request) => {
  if (response.status !== 429) return response;

  // The fetch adapter puts the response headers, with lowercase names, in `extra.headers`.
  const seconds = parseRetryAfter(response.extra?.headers["retry-after"]);
  if (seconds === null || seconds > MAX_WAIT_SECONDS) return response;

  addLog(`429 on ${request.endpoint}. Retry-After: ${seconds} s, waiting.`);
  await sleep(seconds * 1000);
  addLog(`Sending ${request.endpoint} again.`);
  // `setUsed(true)` marks an intentional resend, so it is never deduplicated into the request that waits for it.
  // The caller's `send()` resolves with this response. A second 429 runs through this interceptor again.
  return request.setUsed(true).send();
});

export type Quote = { id: number; quote: string; author: string };

export const getQuote = client.createRequest<{ response: Quote }>()({
  endpoint: "/quotes/random",
  // Five clicks are five calls here. GET requests are deduplicated by default.
  deduplicate: false,
});

// dummyjson has no rate limit, so a mock plays a server that allows 3 requests per 5 seconds.
getQuote.setMock(
  () => {
    const retryAfter = rateLimiter.take();
    if (retryAfter > 0) {
      return {
        error: new Error("Too many requests"),
        status: 429,
        extra: { headers: { "retry-after": String(retryAfter) } },
      };
    }
    return { data: { id: 1, quote: "Make it work, make it right, make it fast.", author: "Kent Beck" }, status: 200 };
  },
  { responseTime: 200 },
);
