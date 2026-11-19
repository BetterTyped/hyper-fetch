import type { Client } from "@hyper-fetch/core";

import type { createDeferred, createListServer, ListCall } from "./use-infinite-fetch.utils";
import { failure } from "./use-infinite-fetch.utils";

export const pageSize = 2;

/**
 * Simulated backend. Every paging style reads from the same list, so the same expectations hold for all of them.
 */
export const createListBackend = () => ({
  version: 1,
  total: 6,
  failing: new Set<number>(),
  gate: null as ReturnType<typeof createDeferred<void>> | null,
});

export type ListBackend = ReturnType<typeof createListBackend>;

export type PagingMode = {
  name: string;
  /** Request starting from the first page */
  create: (client: Client) => any;
  /** Request starting from the given page, counted from 1 */
  at: (client: Client, page: number) => any;
  pagination: any;
  /** Position of the first item requested by the call */
  startOf: (call: ListCall) => number;
  mock: (server: ReturnType<typeof createListServer>, backend: ListBackend) => void;
};

const respond = async (backend: ListBackend, start: number) => {
  await backend.gate?.promise;

  if (backend.failing.has(start)) {
    return failure();
  }

  const end = Math.min(start + pageSize, backend.total);
  const items = [];
  for (let index = start; index < end; index += 1) {
    items.push({ id: index + 1, version: backend.version });
  }

  return {
    items,
    total: backend.total,
    next: end < backend.total ? String(end) : null,
    previous: start > 0 ? String(Math.max(0, start - pageSize)) : null,
  };
};

const fromPage = (page: unknown) => (Number(page) - 1) * pageSize;

const pageFields = { page: "page", limit: "limit", items: "items", total: "total" };

type Response = {
  items: { id: number; version: number }[];
  total: number;
  next: string | null;
  previous: string | null;
};

export const pagingModes: PagingMode[] = [
  {
    name: "page numbers",
    create: (client) =>
      client
        .createRequest<{ response: Response; queryParams: any }>()({ endpoint: "/matrix/page" })
        .setQueryParams({ limit: pageSize }),
    at: (client, page) => pagingModes[0].create(client).setQueryParams({ limit: pageSize, page }),
    pagination: pageFields,
    startOf: (call) => fromPage(call.query.page),
    mock: (server, backend) => {
      server.mockList("/matrix/page", (call) => respond(backend, fromPage(call.query.page)));
    },
  },
  {
    name: "offsets",
    create: (client) =>
      client
        .createRequest<{ response: Response; queryParams: any }>()({ endpoint: "/matrix/offset" })
        .setQueryParams({ limit: pageSize }),
    at: (client, page) => pagingModes[1].create(client).setQueryParams({ limit: pageSize, offset: fromPage(page) }),
    pagination: { offset: "offset", limit: "limit", items: "items", total: "total" },
    startOf: (call) => Number(call.query.offset),
    mock: (server, backend) => {
      server.mockList("/matrix/offset", (call) => respond(backend, Number(call.query.offset)));
    },
  },
  {
    name: "cursors",
    create: (client) =>
      client.createRequest<{ response: Response; queryParams: any }>()({ endpoint: "/matrix/cursor" }),
    at: (client, page) => pagingModes[2].create(client).setQueryParams({ cursor: String(fromPage(page)) }),
    pagination: { cursor: "cursor", next: "next", previous: "previous", items: "items", total: "total" },
    startOf: (call) => Number(call.query.cursor ?? 0),
    mock: (server, backend) => {
      server.mockList("/matrix/cursor", (call) => respond(backend, Number(call.query.cursor ?? 0)));
    },
  },
  {
    name: "URL params",
    create: (client) => pagingModes[3].at(client, 1),
    at: (client, page) =>
      client
        .createRequest<{ response: Response }>()({ endpoint: "/matrix/params/:page/:limit" })
        .setParams({ page, limit: pageSize } as any),
    pagination: { ...pageFields, in: "params" },
    startOf: (call) => fromPage(call.path.split("/")[3]),
    mock: (server, backend) => {
      server.mockList("/matrix/params/:page/:limit", (call) => respond(backend, fromPage(call.path.split("/")[3])));
    },
  },
  {
    name: "payload",
    create: (client) => pagingModes[4].at(client, 1),
    at: (client, page) =>
      client
        .createRequest<{ response: Response; payload: { page: number; limit: number } }>()({
          endpoint: "/matrix/payload",
          method: "POST",
        })
        .setPayload({ page, limit: pageSize }),
    pagination: { ...pageFields, in: "payload" },
    startOf: (call) => fromPage(call.body.page),
    mock: (server, backend) => {
      server.mockListPost("/matrix/payload", (call) => respond(backend, fromPage(call.body.page)));
    },
  },
];
