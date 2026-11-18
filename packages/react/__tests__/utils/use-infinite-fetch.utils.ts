import { createHttpMockingServer } from "@hyper-fetch/testing";
import { delay as wait, http, HttpResponse } from "msw";

export const baseUrl = "http://localhost:3000";

export type ListCall = { path: string; query: Record<string, string>; body: any };

type ListResult = { status: number; data: unknown } | unknown;

export const failure = (status = 500) => ({ __failure: status });

export const createDeferred = <T = void>() => {
  let resolve: (value: T) => void = () => null;
  const promise = new Promise<T>((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
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
