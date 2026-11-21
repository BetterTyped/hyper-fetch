import { createClient } from "@hyper-fetch/core";
import type { Pagination } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type Message = { id: number; body: string; user: { id: number; username: string; fullName: string } };

export const pageSize = 20;

export const getMessagesRequest = client.createRequest<{
  response: { comments: Message[]; total: number; skip: number; limit: number };
  queryParams: { limit: number; skip: number; select: string };
}>()({ endpoint: "/comments" });

/**
 * dummyjson lists the oldest first, so the newest messages are the last page. This asks only for the total: `select`
 * is a dummyjson query param that returns only the listed fields.
 */
export const getMessageCountRequest = getMessagesRequest.setQueryParams({ limit: 1, skip: 0, select: "id" });

export const messagesPagination = {
  offset: "skip",
  limit: "limit",
  items: "comments",
  total: "total",
} satisfies Pagination<typeof getMessagesRequest>;
