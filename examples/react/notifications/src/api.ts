import { createClient } from "@hyper-fetch/core";
import { createSocketClient, ServerSentEventsAdapter } from "@hyper-fetch/sockets";

import type { Notification } from "../server/app";

export type { Notification };

/** The newest notifications kept on screen. Older ones drop off the end of the cached list. */
export const MAX_NOTIFICATIONS = 10;

/** HTTP: the API runs inside the Vite dev server, on the same origin. */
export const client = createClient({ url: "/api" });

export const getNotifications = client.createRequest<{ response: Notification[] }>()({ endpoint: "/notifications" });

export const markRead = client.createRequest<{ response: Notification }>()({
  endpoint: "/notifications/:id/read",
  method: "POST",
});

export const markAllRead = client.createRequest<{ response: { ok: boolean } }>()({
  endpoint: "/notifications/read-all",
  method: "POST",
});

/** Push: named `notification` events from `/api/events`. */
export const socket = createSocketClient({ url: "/api/events", adapter: ServerSentEventsAdapter() });

export const onNotification = socket.createListener<Notification>()({ topic: "notification" });

/** Every change goes through the cached list, so the badge, the list and the tab title always agree. */
export const updateNotifications = (change: (list: Notification[]) => Notification[]) => {
  client.cache.update(getNotifications, (cached) =>
    cached?.data ? { data: change(cached.data).slice(0, MAX_NOTIFICATIONS) } : {},
  );
};
