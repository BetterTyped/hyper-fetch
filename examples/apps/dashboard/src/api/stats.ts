import { Time } from "@hyper-fetch/core";

import { client } from "./client";

/**
 * One request for the three counters: `:resource` is a param, so each resource gets its own cache key.
 * `limit: 1` and `select: "id"` keep the answers tiny, the cards only need `total`.
 */
const getCount = client
  .createRequest<{ response: { total: number }; queryParams: { limit: number; select: string } }>()({
    endpoint: "/:resource",
    staleTime: Time.MIN,
  })
  .setQueryParams({ limit: 1, select: "id" });

export type CountedResource = "users" | "products" | "carts";
export const countOf = (resource: CountedResource) => getCount.setParams({ resource });

/** `limit: 0` returns every cart, the revenue card adds them up with the `select` option of `useFetch`. */
export const getRevenue = client
  .createRequest<{
    response: { carts: { id: number; discountedTotal: number }[] };
    queryParams: { limit: number; select: string };
  }>()({ endpoint: "/carts", staleTime: Time.MIN })
  .setQueryParams({ limit: 0, select: "discountedTotal" });

/**
 * dummyjson numbers never change, so the live card is answered by a HyperFetch mock: every poll gets a new number.
 * With a real API, delete the `setMock` call.
 */
export const getOnlineNow = client.createRequest<{ response: { online: number; at: string } }>()({
  endpoint: "/stats/online",
});

let online = 120;
getOnlineNow.setMock(
  () => {
    online = Math.max(0, online + Math.round(Math.random() * 20 - 10));
    return { data: { online, at: new Date().toISOString() }, status: 200 };
  },
  { responseTime: 300 },
);

/** The switch in the header breaks one widget, to show that a failure stays inside its card. */
getRevenue.setMock(() => ({ error: { message: "Revenue service is down" }, status: 503 })).setMockingEnabled(false);

export const setRevenueFailing = (failing: boolean) => getRevenue.setMockingEnabled(failing);
