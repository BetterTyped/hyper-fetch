import { createSocketClient, ServerSentEventsAdapter } from "@hyper-fetch/sockets";

/** One edit on any Wikimedia wiki. Only the fields the UI uses. */
export type RecentChange = {
  meta: { id: string };
  type: "edit" | "new" | "log" | "categorize";
  title: string;
  title_url: string;
  user: string;
  bot: boolean;
  wiki: string;
  timestamp: number;
};

/** SSE is one-way: the server pushes, the browser listens. The adapter uses the browser's `EventSource`. */
export const socket = createSocketClient({
  url: "https://stream.wikimedia.org/v2/stream/recentchange",
  adapter: ServerSentEventsAdapter(),
  adapterOptions: {
    // Wikimedia sends plain JSON without a `topic` field, so every message is routed to the "recentchange" topic.
    decode: (event) => ({ topic: "recentchange", data: JSON.parse(event.data) }),
  },
});

export const onRecentChange = socket.createListener<RecentChange>()({ topic: "recentchange" });
