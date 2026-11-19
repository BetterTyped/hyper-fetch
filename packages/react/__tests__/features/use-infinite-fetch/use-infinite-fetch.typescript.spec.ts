import type { ExtractErrorType, Pagination } from "@hyper-fetch/core";
import { Client, fetchInfinite } from "@hyper-fetch/core";
import { useInfiniteFetch } from "hooks/use-infinite-fetch";

type Post = { id: number; title: string };

const client = new Client({ url: "http://localhost:3000" });

const getPosts = client.createRequest<{
  response: Post[];
  queryParams: { page?: number; limit?: number; search?: string };
}>()({ endpoint: "/posts" });

const getFeed = client.createRequest<{
  response: { data: Post[]; nextCursor: string | null; count: number; label: string };
  queryParams: { cursor?: string; topic?: string };
}>()({ endpoint: "/feed" });

const getUsers = client.createRequest<{
  response: { users: Post[]; total: number };
  queryParams: { offset?: number; limit?: number };
}>()({ endpoint: "/users" });

// The hook is only type checked here, rendering it would send requests
const types = <T>(callback: () => T) => callback as unknown as T;

describe("useInfiniteFetch [ TypeScript ]", () => {
  it("should infer the items of an array response", () => {
    const list = types(() => useInfiniteFetch(getPosts, { pagination: { page: "page" } }));

    expectTypeOf(list.items).toEqualTypeOf<Post[]>();
    expectTypeOf(list.pages).toEqualTypeOf<Post[][]>();
  });

  it("should infer the items from a response field", () => {
    const list = types(() =>
      useInfiniteFetch(getFeed, { pagination: { cursor: "cursor", next: "nextCursor", items: "data" } }),
    );

    expectTypeOf(list.items).toEqualTypeOf<Post[]>();
  });

  it("should infer the items from a function", () => {
    const list = types(() =>
      useInfiniteFetch(getFeed, {
        pagination: { cursor: "cursor", next: "nextCursor", items: ({ data }) => data.data.map((post) => post.title) },
      }),
    );

    expectTypeOf(list.items).toEqualTypeOf<string[]>();
  });

  it("should type the context of the callbacks", () => {
    types(() =>
      useInfiniteFetch(getFeed, {
        pagination: {
          cursor: "cursor",
          items: "data",
          next: ({ data, pages }) => {
            expectTypeOf(data.nextCursor).toEqualTypeOf<string | null>();
            expectTypeOf(pages).toBeArray();
            return data.nextCursor;
          },
        },
      }),
    );
  });

  it("should use the type returned from select", () => {
    const list = types(() =>
      useInfiniteFetch(getPosts, {
        pagination: { page: "page" },
        select: ({ items }) => items.length,
      }),
    );

    expectTypeOf(list.items).toEqualTypeOf<number>();
  });

  it("should accept a reusable pagination", () => {
    const pagination = { offset: "offset", limit: "limit", items: "users", total: "total" } satisfies Pagination<
      typeof getUsers
    >;
    const list = types(() => useInfiniteFetch(getUsers, { pagination }));

    expectTypeOf(list.items).toEqualTypeOf<Post[]>();
    expectTypeOf(list.total).toEqualTypeOf<number | null>();
  });

  it("should type the prefetched items", () => {
    const result = types(() => fetchInfinite(getPosts, { pagination: { page: "page" } }));

    expectTypeOf(result).resolves.toHaveProperty("items").toEqualTypeOf<Post[]>();
  });

  it("should type the pages, the paging values and the result of the last fetch", () => {
    const getTyped = client.createRequest<{
      response: { data: Post[]; nextCursor: string | null };
      queryParams: { cursor?: string };
      error: { code: number };
    }>()({ endpoint: "/typed" });
    const list = types(() =>
      useInfiniteFetch(getTyped, { pagination: { cursor: "cursor", next: "nextCursor", items: "data" } }),
    );

    expectTypeOf(list.pages).toEqualTypeOf<{ data: Post[]; nextCursor: string | null }[]>();
    expectTypeOf(list.pageParams).toEqualTypeOf<unknown[]>();
    expectTypeOf(list.error).toEqualTypeOf<ExtractErrorType<typeof getTyped> | null>();
    expectTypeOf<{ code: number }>().toMatchTypeOf<NonNullable<typeof list.error>>();
    expectTypeOf(list.hasNextPage).toEqualTypeOf<boolean>();
    expectTypeOf(list.isFetchNextPageError).toEqualTypeOf<boolean>();
    expectTypeOf(list.abort).toEqualTypeOf<() => void>();
  });

  it("should type the responses of the actions and the page events", () => {
    const list = types(() => useInfiniteFetch(getPosts, { pagination: { page: "page" } }));

    expectTypeOf(list.fetchNextPage).parameters.toEqualTypeOf<[]>();
    expectTypeOf<NonNullable<Awaited<ReturnType<typeof list.fetchNextPage>>>["data"]>().toEqualTypeOf<Post[] | null>();
    expectTypeOf<Awaited<ReturnType<typeof list.fetchNextPage>>>().toBeNullable();
    expectTypeOf(list.fetchPreviousPage).toEqualTypeOf(list.fetchNextPage);
    expectTypeOf(list.refetch).toEqualTypeOf(list.fetchNextPage);
    expectTypeOf(list.reset).toEqualTypeOf(list.fetchNextPage);

    types(() => {
      list.onSuccess(({ response, request, param }) => {
        expectTypeOf(response.data).toEqualTypeOf<Post[] | null>();
        expectTypeOf(request.endpoint).toEqualTypeOf<"/posts">();
        expectTypeOf(request.queryParams).toEqualTypeOf(getPosts.queryParams);
        expectTypeOf(param).toBeUnknown();
      });
      list.onError(({ response }) => {
        expectTypeOf(response.success).toEqualTypeOf<boolean>();
      });
      list.onReset(() => null);
    });
  });

  it("should type the context of select and uniqueBy", () => {
    types(() =>
      useInfiniteFetch(getFeed, {
        pagination: { cursor: "cursor", next: "nextCursor", items: "data" },
        uniqueBy: ({ item }) => {
          expectTypeOf(item).toEqualTypeOf<Post>();
          return item.id;
        },
        select: ({ items, pages }) => {
          expectTypeOf(items).toEqualTypeOf<Post[]>();
          expectTypeOf(pages).toEqualTypeOf<
            { data: Post[]; nextCursor: string | null; count: number; label: string }[]
          >();
          return pages.length;
        },
      }),
    );
    types(() => useInfiniteFetch(getPosts, { pagination: { page: "page" }, uniqueBy: "id" }));
  });

  it("should reject a wrong pagination", () => {
    types(() => {
      // @ts-expect-error pagination is required
      useInfiniteFetch(getPosts, {});
      // @ts-expect-error not a query param of the request
      useInfiniteFetch(getPosts, { pagination: { page: "pageNumber" } });
      // @ts-expect-error the page has to be a number
      useInfiniteFetch(getPosts, { pagination: { page: "search" } });
      // @ts-expect-error the limit has to be a number
      useInfiniteFetch(getPosts, { pagination: { page: "page", limit: "search" } });
      // @ts-expect-error offset pagination needs the limit
      useInfiniteFetch(getUsers, { pagination: { offset: "offset", items: "users" } });
      // @ts-expect-error cursor pagination needs the next cursor
      useInfiniteFetch(getFeed, { pagination: { cursor: "cursor", items: "data" } });
      // @ts-expect-error not a response field
      useInfiniteFetch(getFeed, { pagination: { cursor: "cursor", next: "nope", items: "data" } });
      // @ts-expect-error the next cursor cannot be a list
      useInfiniteFetch(getFeed, { pagination: { cursor: "cursor", next: "data", items: "data" } });
      // @ts-expect-error items are required when the response is not an array
      useInfiniteFetch(getFeed, { pagination: { cursor: "cursor", next: "nextCursor" } });
      // @ts-expect-error items have to be an array field
      useInfiniteFetch(getFeed, { pagination: { cursor: "cursor", next: "nextCursor", items: "label" } });
      useInfiniteFetch(getFeed, {
        // @ts-expect-error total has to be a number field
        pagination: { cursor: "cursor", next: "nextCursor", items: "data", total: "label" },
      });
      // @ts-expect-error modes cannot be mixed
      useInfiniteFetch(getPosts, { pagination: { page: "page", offset: "limit" } });
      // @ts-expect-error not a field of the item
      useInfiniteFetch(getPosts, { pagination: { page: "page" }, uniqueBy: "nope" });
    });
  });
});
