/* eslint-disable react/state-in-constructor, react/no-set-state */
import { Client, fetchInfinite } from "@hyper-fetch/core";
import { act, render, screen, waitFor } from "@testing-library/react";
import { useInfiniteFetch } from "hooks/use-infinite-fetch";
import { Hydrate } from "hydrate";
import { Provider } from "provider";
import React, { Suspense } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";

import { baseUrl, createListServer, failure, pageItems } from "../../utils/use-infinite-fetch.utils";

const { startServer, stopServer, resetMocks, mockList, calls, resetCalls } = createListServer();

type Post = { id: number };

class Boundary extends React.Component<
  { children: React.ReactNode; onError?: (error: unknown) => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <button type="button" onClick={() => this.setState({ hasError: false })}>
          boundary
        </button>
      );
    }
    return this.props.children;
  }
}

describe("useInfiniteFetch [ Boundaries ]", () => {
  let client: Client;

  const createPosts = (testClient: Client = client) =>
    testClient.createRequest<{ response: Post[]; queryParams: { page?: number } }>()({ endpoint: "/posts" });

  const pagination = { page: "page" } as const;

  beforeAll(() => startServer());
  afterAll(() => stopServer());

  beforeEach(() => {
    client = new Client({ url: baseUrl });
    resetCalls();
    mockList("/posts", ({ query }) => pageItems(Number(query.page)));
  });

  afterEach(() => resetMocks());

  describe("suspense", () => {
    const List = () => {
      const { items, fetchNextPage, isFetchingNextPage } = useInfiniteFetch(createPosts(), {
        pagination,
        suspense: true,
      });
      return (
        <button type="button" onClick={() => fetchNextPage()}>
          items:{items.length} next:{String(isFetchingNextPage)}
        </button>
      );
    };

    it("should suspend until the first page and send one request", async () => {
      render(
        <Suspense fallback="loading">
          <List />
        </Suspense>,
      );

      expect(screen.getByText("loading")).toBeInTheDocument();
      await screen.findByText(/items:2/);
      expect(calls).toHaveLength(1);
    });

    it("should not suspend for later pages", async () => {
      render(
        <Suspense fallback="loading">
          <List />
        </Suspense>,
      );
      await screen.findByText(/items:2/);

      act(() => screen.getByRole("button").click());

      expect(screen.queryByText("loading")).not.toBeInTheDocument();
      await screen.findByText(/items:4/);
    });

    it("should not suspend when the pages are cached", async () => {
      client.cache.set(createPosts().setQueryParams({ page: 1 }), {
        data: pageItems(1),
        error: null,
        status: 200,
        success: true,
        extra: {},
        requestTimestamp: Date.now(),
        responseTimestamp: Date.now(),
      } as any);

      render(
        <Suspense fallback="loading">
          <List />
        </Suspense>,
      );

      expect(screen.queryByText("loading")).not.toBeInTheDocument();
      expect(screen.getByText(/items:2/)).toBeInTheDocument();
    });

    it("should render the error of the first page instead of suspending forever", async () => {
      mockList("/posts", () => failure());
      const ErrorList = () => {
        const { error } = useInfiniteFetch(createPosts(), { pagination, suspense: true });
        return <div>{error ? "failed" : "fine"}</div>;
      };

      render(
        <Suspense fallback="loading">
          <ErrorList />
        </Suspense>,
      );

      await screen.findByText("failed");
      expect(calls).toHaveLength(1);
    });
  });

  describe("throwOnError", () => {
    let consoleError: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleError = vi.spyOn(console, "error").mockImplementation(() => null);
    });

    afterEach(() => consoleError.mockRestore());

    const List = ({ throwOnError = true }: { throwOnError?: boolean | ((error: unknown) => boolean) }) => {
      const { items } = useInfiniteFetch(createPosts(), { pagination, throwOnError });
      return <div>items:{items.length}</div>;
    };

    it("should throw the error to the boundary", async () => {
      mockList("/posts", () => failure());
      const onError = vi.fn();

      render(
        <Boundary onError={onError}>
          <List />
        </Boundary>,
      );

      await screen.findByText("boundary");
      expect(onError).toHaveBeenCalled();
    });

    it("should let a function decide", async () => {
      mockList("/posts", () => failure());

      render(
        <Boundary>
          <List throwOnError={() => false} />
        </Boundary>,
      );

      await waitFor(() => expect(calls).toHaveLength(1));
      await new Promise((resolve) => {
        setTimeout(resolve, 30);
      });
      expect(screen.getByText("items:0")).toBeInTheDocument();
    });

    it("should load the list again after the boundary resets", async () => {
      mockList("/posts", () => failure());
      render(
        <Boundary>
          <List />
        </Boundary>,
      );
      await screen.findByText("boundary");
      await new Promise((resolve) => {
        setTimeout(resolve, 5);
      });

      mockList("/posts", ({ query }) => pageItems(Number(query.page)));
      act(() => screen.getByRole("button").click());

      await screen.findByText("items:2");
    });
  });

  describe("suspense with throwOnError", () => {
    it("should load a list that never mounted again after the boundary resets", async () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => null);
      mockList("/posts", () => failure());

      const List = () => {
        const { items } = useInfiniteFetch(createPosts(), { pagination, suspense: true, throwOnError: true });
        return <div>items:{items.length}</div>;
      };

      render(
        <Boundary>
          <Suspense fallback="loading">
            <List />
          </Suspense>
        </Boundary>,
      );
      await screen.findByText("boundary");
      await new Promise((resolve) => {
        setTimeout(resolve, 5);
      });

      mockList("/posts", ({ query }) => pageItems(Number(query.page)));
      act(() => screen.getByRole("button").click());

      await screen.findByText("items:2");
      consoleError.mockRestore();
    });
  });

  describe("provider", () => {
    it("should use the defaults of the provider and let the hook override them", async () => {
      const Disabled = (options: { disabled?: boolean }) => {
        const { items } = useInfiniteFetch(createPosts(), { pagination, ...options });
        return <div>items:{items.length}</div>;
      };

      const { rerender } = render(
        <Provider config={{ useInfiniteFetchConfig: { disabled: true } }}>
          <Disabled />
        </Provider>,
      );
      await new Promise((resolve) => {
        setTimeout(resolve, 30);
      });
      expect(calls).toHaveLength(0);

      rerender(
        <Provider config={{ useInfiniteFetchConfig: { disabled: true } }}>
          <Disabled disabled={false} />
        </Provider>,
      );

      await screen.findByText("items:2");
    });
  });

  describe("server rendering", () => {
    const List = ({ testClient }: { testClient: Client }) => {
      const { items, loading } = useInfiniteFetch(createPosts(testClient), { pagination, dependencyTracking: false });
      return <div data-testid="list">{loading ? "loading" : items.map((item) => item.id).join(",")}</div>;
    };

    it("should fetch the first pages one after another", async () => {
      const result = await fetchInfinite(createPosts(), { pagination, pages: 2 });

      expect(calls.map((call) => call.query.page)).toEqual(["1", "2"]);
      expect(result.items.map((item) => item.id)).toEqual([1, 2, 3, 4]);
      expect(result.dehydrated).toHaveLength(2);
      expect(client.cache.keys()).toHaveLength(0);
    });

    it("should render all the prefetched pages on the server", async () => {
      const server = new Client({ url: baseUrl, mode: "server" } as any);
      const { dehydrated } = await fetchInfinite(createPosts(server), { pagination, pages: 2 });

      const html = renderToString(
        <Hydrate client={server} data={dehydrated}>
          <List testClient={server} />
        </Hydrate>,
      );

      expect(html).toContain("1,2,3,4");
      expect(server.cache.keys()).toHaveLength(0);
    });

    it("should keep renders of different users apart on one server client", async () => {
      const server = new Client({ url: baseUrl, mode: "server" } as any);
      const first = await fetchInfinite(createPosts(server), { pagination });
      mockList("/posts", () => [{ id: 77 }]);
      const second = await fetchInfinite(createPosts(server), { pagination });

      const renderList = (data: typeof first.dehydrated) =>
        renderToString(
          <Hydrate client={server} data={data}>
            <List testClient={server} />
          </Hydrate>,
        );

      expect(renderList(first.dehydrated)).toContain("1,2");
      expect(renderList(second.dehydrated)).toContain(">77<");
      expect(renderList(first.dehydrated)).toContain("1,2");
    });

    it("should hydrate without a mismatch or a request", async () => {
      const server = new Client({ url: baseUrl, mode: "server" } as any);
      const { dehydrated } = await fetchInfinite(createPosts(server), { pagination, pages: 2 });
      // Data crosses from the server to the browser as JSON
      // oxlint-disable-next-line unicorn/prefer-structured-clone
      const wire = JSON.parse(JSON.stringify(dehydrated));
      const html = renderToString(
        <Hydrate client={server} data={wire}>
          <List testClient={server} />
        </Hydrate>,
      );
      resetCalls();

      const spy = vi.spyOn(console, "error");
      const container = document.createElement("div");
      container.innerHTML = html;
      document.body.append(container);

      await act(async () => {
        hydrateRoot(
          container,
          <Hydrate client={client} data={wire}>
            <List testClient={client} />
          </Hydrate>,
        );
      });

      expect(container.textContent).toBe("1,2,3,4");
      expect(spy).not.toHaveBeenCalled();
      await new Promise((resolve) => {
        setTimeout(resolve, 30);
      });
      expect(calls).toHaveLength(0);
      expect(client.cache.keys()).toHaveLength(2);

      spy.mockRestore();
      container.remove();
    });

    it("should stop prefetching at the end of the list and on a failure", async () => {
      mockList("/posts", ({ query }) => (query.page === "1" ? pageItems(1) : []));
      const finished = await fetchInfinite(createPosts(), { pagination, pages: 5 });
      expect(finished.pages).toHaveLength(1 + 1);
      expect(finished.hasNextPage).toBe(false);

      mockList("/posts", ({ query }) => (query.page === "1" ? pageItems(1) : failure()));
      const failed = await fetchInfinite(createPosts(), { pagination, pages: 5 });
      expect(failed.pages).toHaveLength(1);
      expect(failed.error).toBeTruthy();
      expect(failed.dehydrated).toHaveLength(1);
    });
  });
});
