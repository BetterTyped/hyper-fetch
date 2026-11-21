import { createClient } from "@hyper-fetch/core";
import { createSocketClient, ServerSentEventsAdapter } from "@hyper-fetch/sockets";

import type { Order, OrderEvent } from "../server/app";

export type { Order, OrderEvent };

/** HTTP: the API runs inside the Vite dev server, on the same origin. */
export const client = createClient({ url: "/api" });

export const getOrders = client.createRequest<{ response: Order[] }>()({ endpoint: "/orders" });

export const advanceOrder = client.createRequest<{ response: Order }>()({
  endpoint: "/orders/:orderId/advance",
  method: "POST",
});

/** Push: one EventSource on `/api/events`. Named events (`event: order`) go to the listener with that topic. */
export const socket = createSocketClient({ url: "/api/events", adapter: ServerSentEventsAdapter() });

export const onOrderEvent = socket.createListener<OrderEvent>()({ topic: "order" });
