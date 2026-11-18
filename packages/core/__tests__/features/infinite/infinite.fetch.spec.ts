import { Client, fetchInfinite } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { http, HttpResponse } from "msw";

const baseUrl = "http://localhost:3000";

type Post = { id: number };

describe("Infinite [ fetchInfinite ]", () => {
  const { server, startServer, stopServer, resetMocks } = createHttpMockingServer();
  const calls: Record<string, string>[] = [];

  let client: Client;

  const createPosts = () =>
    client.createRequest<{ response: Post[]; queryParams: { page?: number; limit?: number; search?: string } }>()({
      endpoint: "/posts",
    });

  const createFeed = () =>
    client.createRequest<{
      response: { data: Post[]; next: string | null; total: number };
      queryParams: { cursor?: string };
    }>()({ endpoint: "/feed" });

  const mock = (path: string, handler: (query: Record<string, string>) => unknown, status = 200) => {
    server.use(
      http.get(`${baseUrl}${path}`, ({ request }) => {
        const query = Object.fromEntries(new URL(request.url).searchParams.entries());
        calls.push(query);
        return HttpResponse.json(handler(query) as any, { status });
      }),
    );
  };

  const mockPosts = (lastPage = 9) => {
    mock("/posts", ({ page }) => (Number(page) > lastPage ? [] : [{ id: Number(page) }]));
  };

  beforeAll(() => startServer());
  afterAll(() => stopServer());

  beforeEach(() => {
    client = new Client({ url: baseUrl });
    calls.length = 0;
  });

  afterEach(() => resetMocks());

  it("should fetch only the first page by default", async () => {
    mockPosts();

    const result = await fetchInfinite(createPosts(), { pagination: { page: "page" } });

    expect(calls).toEqual([{ page: "1" }]);
    expect(result.items).toEqual([{ id: 1 }]);
    expect(result.pages).toEqual([[{ id: 1 }]]);
    expect(result.pageParams).toEqual([1]);
    expect(result.hasNextPage).toBe(true);
    expect(result.error).toBeNull();
  });

  it.each([0, -3])("should fetch one page when asked for %s pages", async (pages) => {
    mockPosts();

    const result = await fetchInfinite(createPosts(), { pagination: { page: "page" }, pages });

    expect(result.pages).toHaveLength(1);
  });

  it("should fetch the pages one after another", async () => {
    mockPosts();

    const result = await fetchInfinite(createPosts(), { pagination: { page: "page" }, pages: 3 });

    expect(calls.map((call) => call.page)).toEqual(["1", "2", "3"]);
    expect(result.items).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(result.responses).toHaveLength(3);
  });

  it("should start from the page set on the request and keep other query params", async () => {
    mockPosts();

    const result = await fetchInfinite(createPosts().setQueryParams({ page: 4, search: "a" }), {
      pagination: { page: "page" },
      pages: 2,
    });

    expect(calls).toEqual([
      { page: "4", search: "a" },
      { page: "5", search: "a" },
    ]);
    expect(result.pageParams).toEqual([4, 5]);
  });

  it("should stop at the end of the list", async () => {
    mockPosts(1);

    const result = await fetchInfinite(createPosts(), { pagination: { page: "page" }, pages: 9 });

    expect(calls).toHaveLength(2);
    expect(result.hasNextPage).toBe(false);
    expect(result.items).toEqual([{ id: 1 }]);
  });

  it("should follow cursors and read the total", async () => {
    mock("/feed", ({ cursor }) => {
      return cursor ? { data: [{ id: 2 }], next: null, total: 2 } : { data: [{ id: 1 }], next: "second", total: 2 };
    });

    const result = await fetchInfinite(createFeed(), {
      pagination: { cursor: "cursor", next: "next", items: "data", total: "total" },
      pages: 5,
    });

    expect(calls).toEqual([{}, { cursor: "second" }]);
    expect(result.items).toEqual([{ id: 1 }, { id: 2 }]);
    expect(result.pageParams).toEqual([undefined, "second"]);
    expect(result.total).toBe(2);
    expect(result.hasNextPage).toBe(false);
  });

  it("should keep the last known total when a page does not report it", async () => {
    mock("/feed", ({ cursor }) => {
      return cursor ? { data: [], next: null } : { data: [{ id: 1 }], next: "second", total: 7 };
    });

    const result = await fetchInfinite(createFeed(), {
      pagination: { cursor: "cursor", next: "next", items: "data", total: "total" },
      pages: 2,
    });

    expect(result.total).toBe(7);
  });

  it("should stop on a failed first page", async () => {
    mock("/posts", () => ({ message: "Failed" }), 500);

    const result = await fetchInfinite(createPosts(), { pagination: { page: "page" }, pages: 3 });

    expect(calls).toHaveLength(1);
    expect(result.error).toEqual({ message: "Failed" });
    expect(result.items).toEqual([]);
    expect(result.pages).toEqual([]);
    expect(result.dehydrated).toEqual([]);
    expect(result.responses).toHaveLength(1);
    expect(result.hasNextPage).toBe(false);
  });

  it("should keep the pages fetched before a failure", async () => {
    server.use(
      http.get(`${baseUrl}/posts`, ({ request }) => {
        const page = new URL(request.url).searchParams.get("page");
        return page === "1"
          ? HttpResponse.json([{ id: 1 }])
          : HttpResponse.json({ message: "Failed" }, { status: 500 });
      }),
    );

    const result = await fetchInfinite(createPosts(), { pagination: { page: "page" }, pages: 3 });

    expect(result.items).toEqual([{ id: 1 }]);
    expect(result.dehydrated).toHaveLength(1);
    expect(result.error).toEqual({ message: "Failed" });
  });

  it("should dehydrate every page under its own cache key", async () => {
    mockPosts();

    const { dehydrated } = await fetchInfinite(createPosts(), { pagination: { page: "page" }, pages: 2 });

    expect(dehydrated.map((item) => item.cacheKey)).toEqual([
      createPosts().setQueryParams({ page: 1 }).cacheKey,
      createPosts().setQueryParams({ page: 2 }).cacheKey,
    ]);
    expect(dehydrated[1].response.data).toEqual([{ id: 2 }]);
  });

  it("should keep the scope in the dehydrated pages", async () => {
    mockPosts();

    const { dehydrated } = await fetchInfinite(createPosts().setScope("user"), { pagination: { page: "page" } });

    expect(dehydrated[0].scope).toBe("user");
  });

  it("should fill the cache only after hydrating", async () => {
    mockPosts();

    const { dehydrated } = await fetchInfinite(createPosts(), { pagination: { page: "page" }, pages: 2 });

    expect(client.cache.keys()).toHaveLength(0);

    client.hydrate(dehydrated);

    expect(client.cache.keys()).toHaveLength(2);
    expect(createPosts().setQueryParams({ page: 2 }).read()?.data).toEqual([{ id: 2 }]);
  });

  it("should not use the queues", async () => {
    mockPosts();
    const add = vi.spyOn(client.fetchDispatcher, "add");

    await fetchInfinite(createPosts(), { pagination: { page: "page" }, pages: 2 });

    expect(add).not.toHaveBeenCalled();
  });

  it("should explain a missing pagination", async () => {
    await expect(fetchInfinite(createPosts(), {} as any)).rejects.toThrow('"pagination" option');
    expect(calls).toHaveLength(0);
  });
});
