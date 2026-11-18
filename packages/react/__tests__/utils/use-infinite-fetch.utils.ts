import type { Client } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { cleanup, configure, waitFor } from "@testing-library/react";
import { delay as wait, http, HttpResponse } from "msw";

// Responses travel through a mocked network - a busy machine can need more than the default second.
// This is only the limit of waiting, passing tests continue as soon as the condition is met.
configure({ asyncUtilTimeout: 5000 });
vi.setConfig({ testTimeout: 30_000 });

export const baseUrl = "http://localhost:3000";

export type ListCall = { path: string; query: Record<string, string>; body: any };

type ListResult = { status: number; data: unknown } | unknown;

export const failure = (status = 500) => ({ __failure: status });

const openGates = new Set<VoidFunction>();

export const createDeferred = <T = void>() => {
  let resolve: (value: T) => void = () => null;
  const promise = new Promise<T>((resolver) => {
    resolve = resolver;
  });
  openGates.add(() => resolve(undefined as T));
  return { promise, resolve };
};

/**
 * Unmounting does not cancel requests. One still on its way could reach the server during the next test
 * and be counted there, so every test waits for its own requests to finish.
 */
export const settleRequests = async (client: Client) => {
  cleanup();
  openGates.forEach((open) => open());
  openGates.clear();
  await waitFor(() => expect(client.fetchDispatcher.getAllRunningRequests()).toHaveLength(0));
};

/**
 * The shared request mock matches by path only - lists need the response to depend on the query params
 */
export const createListServer = () => {
  const mocking = createHttpMockingServer();
  const calls: ListCall[] = [];

  const respond = async (request: Request, handler: (call: ListCall) => ListResult | Promise<ListResult>) => {
    const url = new URL(request.url);
    const body = request.method === "GET" ? null : await request.clone().json();
    const call = { path: url.pathname, query: Object.fromEntries(url.searchParams.entries()), body };
    calls.push(call);

    await wait(5);
    const result: any = await handler(call);

    if (result?.__failure) {
      return HttpResponse.json({ message: "Failed" }, { status: result.__failure });
    }
    return HttpResponse.json(result as any);
  };

  const mockList = (path: string, handler: (call: ListCall) => ListResult | Promise<ListResult>) => {
    mocking.server.use(http.get(`${baseUrl}${path}`, ({ request }) => respond(request, handler)));
  };

  const mockListPost = (path: string, handler: (call: ListCall) => ListResult | Promise<ListResult>) => {
    mocking.server.use(http.post(`${baseUrl}${path}`, ({ request }) => respond(request, handler)));
  };

  return {
    ...mocking,
    calls,
    mockList,
    mockListPost,
    resetCalls: () => {
      calls.length = 0;
    },
  };
};

/** Numbers of the items on a page, e.g. page 2 of size 2 holds [3, 4] */
export const pageItems = (page: number, size = 2) => {
  return Array.from({ length: size }, (_, index) => ({ id: (page - 1) * size + index + 1 }));
};

export const sleep = (time: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, time);
  });
