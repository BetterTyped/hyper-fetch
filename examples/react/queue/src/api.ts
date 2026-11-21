import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

type Message = { title: string; userId: number };

/**
 * `queued: true` sends requests of this queue one at a time, in the order they were added.
 * A fixed `queryKey` names the queue, so `useQueue` and every `submit()` refer to the same one.
 * `delay` makes each send take 1.5 s, which leaves time to pause, stop or remove messages.
 */
export const sendMessageRequest = client
  .createRequest<{
    response: Message & { id: number };
    payload: Message;
    queryParams: { delay: number };
  }>()({
    endpoint: "/posts/add",
    method: "POST",
    queued: true,
    queryKey: "outbox",
  })
  .setQueryParams({ delay: 1500 });
