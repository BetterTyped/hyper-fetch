import type { CacheValueType } from "@hyper-fetch/core";

import { addActivity } from "./activity";
import { client } from "./client";

// Every tab of this site that opens the same channel gets the messages. The sender does not.
const channel = new BroadcastChannel("hyper-fetch-kanban");
let applyingRemoteChange = false;

// 1. This tab wrote to its cache: a response, an optimistic change or its rollback. Send the entry to the other tabs.
client.cache.events.onData((value) => {
  // Without this flag, a change received from another tab would be sent straight back.
  if (applyingRemoteChange || !value.cached) return;
  channel.postMessage(value);
});

// 2. Another tab wrote to its cache. Save the same entry here, and every hook reading that key re-renders.
channel.onmessage = ({ data }: MessageEvent<CacheValueType>) => {
  applyingRemoteChange = true;
  client.cache.set({ ...data, cache: true }, data);
  applyingRemoteChange = false;
  addActivity("Board updated from another tab", "synced");
};
