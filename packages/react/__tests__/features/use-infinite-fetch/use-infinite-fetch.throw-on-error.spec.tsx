import { Client } from "@hyper-fetch/core";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useInfiniteFetch } from "hooks/use-infinite-fetch";

import { baseUrl, createListServer, failure, pageItems, settleRequests } from "../../utils/use-infinite-fetch.utils";

const { startServer, stopServer, resetMocks, mockList, resetCalls } = createListServer();

/**
 * `throwOnError` of a request makes `send()` reject - the hook sends its pages itself and reports failures through its
 * state, so a request configured for React Query or SWR keeps working with it.
 */
describe("useInfiniteFetch [ throwOnError ]", () => {
  let client: Client;

  const createPosts = () =>
    client
      .createRequest<{
        response: { id: number }[];
        queryParams: { page?: number };
      }>()({ endpoint: "/posts" })
      .setThrowOnError(true);

  beforeAll(() => startServer());
  afterAll(() => stopServer());

  beforeEach(() => {
    client = new Client({ url: baseUrl });
    resetCalls();
  });

  afterEach(async () => {
    await settleRequests(client);
    resetMocks();
  });

  it("should report a failed page in the state instead of rejecting", async () => {
    mockList("/posts", ({ query }) => (query.page === "2" ? failure() : pageItems(Number(query.page))));
    const { result } = renderHook(() =>
      useInfiniteFetch(createPosts(), {
        pagination: { page: "page" },
        dependencyTracking: false,
      }),
    );
    await waitFor(() => expect(result.current.items).toHaveLength(2));

    await act(() => result.current.fetchNextPage());

    expect(result.current.isFetchNextPageError).toBe(true);
    expect(result.current.error).toBeTruthy();
    expect(result.current.items).toHaveLength(2);
  });

  it("should report a failed first page in the state instead of rejecting", async () => {
    mockList("/posts", () => failure());
    const { result } = renderHook(() =>
      useInfiniteFetch(createPosts(), {
        pagination: { page: "page" },
        dependencyTracking: false,
      }),
    );

    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.loading).toBe(false);
    expect(result.current.items).toEqual([]);
  });
});
