import { Hono } from "hono";
import { stream } from "hono/streaming";

export type ChatMessage = { role: "user" | "assistant"; content: string };

/** A fake model: a few canned answers, picked by keyword, with some variety for "Regenerate". */
const answers: Record<string, string[]> = {
  cache: [
    "HyperFetch keeps every response in a cache keyed by the request. Two components that read the same request share one entry, so the second one renders at once without another call.",
    "Responses are cached by key. staleTime decides when data counts as old, and cacheTime decides when it is removed. You can also write to the cache yourself with client.cache.update().",
  ],
  offline: [
    "Requests made offline wait in the dispatcher queue. When the app manager reports the network again, the queue is sent in order. Give the dispatcher a storage and the queue survives a reload too.",
  ],
  default: [
    "Good question. I am a fake model running in server/app.ts, so I only know a few answers. I stream them word by word, the way a real model streams tokens, so you can see useStream render each chunk as it arrives.",
    "This answer comes from a Hono route that writes one word every few dozen milliseconds. The client reads the response body as a stream and shows the text while it grows. Try asking about the cache or offline mode.",
    "Streaming lets the reader start before the answer is complete. Press Stop to cancel the response: the client cancels the body, and the server sees the request abort and stops writing.",
  ],
};

const pickAnswer = (messages: ChatMessage[]) => {
  const question =
    [...messages]
      .reverse()
      .find((message) => message.role === "user")
      ?.content.toLowerCase() ?? "";
  const topic = Object.keys(answers).find((key) => question.includes(key)) ?? "default";
  const options = answers[topic];
  return options[Math.floor(Math.random() * options.length)];
};

const app = new Hono().basePath("/api").post("/chat", async (c) => {
  const { messages } = await c.req.json<{ messages: ChatMessage[] }>();
  // Split into words with their spaces, so the client gets a few characters at a time.
  const tokens = pickAnswer(messages).match(/\S+\s*/g) ?? [];

  c.header("Content-Type", "text/plain; charset=utf-8");
  return stream(c, async (body) => {
    let sent = 0;
    body.onAbort(() => console.log(`[chat] client stopped the stream after ${sent} of ${tokens.length} tokens`));

    for (const token of tokens) {
      if (body.aborted) return;
      await body.write(token);
      sent += 1;
      // A model does not answer at a steady pace.
      await body.sleep(30 + Math.random() * 70);
    }
  });
});

// `@hono/vite-dev-server` serves the default export inside the Vite dev server.
export default app;
