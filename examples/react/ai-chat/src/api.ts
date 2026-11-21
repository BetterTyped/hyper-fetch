import { createClient } from "@hyper-fetch/core";

import type { ChatMessage } from "../server/app";

export type { ChatMessage };

/** The API runs inside the Vite dev server, on the same origin. */
export const client = createClient({ url: "/api" });

/**
 * The answer is plain text. `useStream` sends the request with the `streaming` adapter option and reads the body
 * chunk by chunk, instead of waiting for the whole text. The timeout only covers the wait for the headers.
 */
export const sendChat = client.createRequest<{ response: string; payload: { messages: ChatMessage[] } }>()({
  endpoint: "/chat",
  method: "POST",
});
