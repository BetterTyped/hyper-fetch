import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type User = { id: number; firstName: string; lastName: string };

/**
 * `deduplicate: true` lets identical requests that start while one is in flight share that call and its response.
 * The default HTTP adapter already turns it on for GET requests; it is set here to make it visible.
 * `delay` keeps the request in flight for a second, so every caller below overlaps with the first one.
 */
export const getUserRequest = client
  .createRequest<{
    response: User;
    queryParams: { select: string; delay: number };
  }>()({
    endpoint: "/users/:userId",
    deduplicate: true,
  })
  .setParams({ userId: 1 })
  // `select` and `delay` are dummyjson query params: return only these fields, answer after `delay` ms.
  .setQueryParams({ select: "firstName,lastName", delay: 1000 });
