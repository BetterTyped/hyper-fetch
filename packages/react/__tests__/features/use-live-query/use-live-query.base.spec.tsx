import { createClient } from "@hyper-fetch/core";
import { collection, createDb, eq, rowType } from "@hyper-fetch/db";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useLiveQuery } from "hooks/use-live-query";
import { StrictMode } from "react";
import { expectTypeOf } from "vitest";

const { startServer, stopServer, resetMocks, mockRequest } = createHttpMockingServer();

type Post = { id: number; teamId: number; title: string; next?: string | null };

const createSetup = () => {
  const client = createClient({ url: "http://localhost:3000" });
  const getTeamPosts = client.createRequest<{ response: Post[] }>()({ endpoint: "/teams/:teamId/posts" });
  const getPage = client.createRequest<{
    response: { items: Post[]; next: string | null };
    queryParams?: { cursor?: string };
  }>()({
    endpoint: "/pages",
  });
  const updatePost = client.createRequest<{ response: Post; payload: Partial<Post> }>()({
    endpoint: "/posts/:postId",
    method: "PATCH",
  });
  const Posts = collection(rowType<Post>(), { key: "id" })
    .load(getTeamPosts, { where: { teamId: { eq: (teamId) => ({ params: { teamId } }), required: true } } })
    .mutate({
      update: { request: updatePost, map: (key, changes) => ({ params: { postId: key }, payload: changes }) },
    });
  const Pages = collection(rowType<Post>(), { key: "id" }).load(getPage, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
  });
  const db = createDb({ posts: Posts, pages: Pages }, { gcTime: 10 });
  return { client, db, getTeamPosts, getPage, updatePost };
};

describe("useLiveQuery [ Base ]", () => {
  let setup = createSetup();

  beforeAll(() => startServer());
  beforeEach(() => {
    resetMocks();
    setup = createSetup();
  });
  afterEach(() => setup.db.destroy());
  afterAll(() => stopServer());

  it("loads on mount and renders the result", async () => {
    const { db, getTeamPosts } = setup;
    mockRequest(getTeamPosts.setParams({ teamId: 1 }), { data: [{ id: 1, teamId: 1, title: "One" }] });
    const { result } = renderHook(() =>
      useLiveQuery(db.posts.where((post) => eq(post.teamId, 1)).select((post) => ({ title: post.title }))),
    );
    expect(result.current).toMatchObject({ status: "loading", data: undefined, isFetching: true });
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.data).toStrictEqual([{ title: "One" }]);
    expectTypeOf(result.current.data).toEqualTypeOf<{ title: string }[] | undefined>();
  });

  it("keeps one subscription for a query rebuilt on every render, and re-renders when rows change", async () => {
    const { db, getTeamPosts, updatePost } = setup;
    mockRequest(getTeamPosts.setParams({ teamId: 1 }), { data: [{ id: 1, teamId: 1, title: "One" }] });
    const { result, rerender } = renderHook(() => useLiveQuery(db.posts.where((post) => eq(post.teamId, 1))));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    const before = result.current;
    rerender();
    expect(result.current).toBe(before);

    mockRequest(updatePost.setParams({ postId: 1 }), { data: { id: 1, teamId: 1, title: "Two" }, delay: 20 });
    act(() => {
      db.posts.update(1, { title: "Two" });
    });
    expect(result.current.data?.[0].title).toBe("Two");
  });

  it("subscribes again when the query changes and releases the old one on unmount", async () => {
    const { db, getTeamPosts } = setup;
    mockRequest(getTeamPosts.setParams({ teamId: 1 }), { data: [{ id: 1, teamId: 1, title: "One" }] });
    mockRequest(getTeamPosts.setParams({ teamId: 2 }), { data: [{ id: 2, teamId: 2, title: "Two" }] });
    const { result, rerender, unmount } = renderHook(
      ({ teamId }) => useLiveQuery(db.posts.where((post) => eq(post.teamId, teamId))),
      { initialProps: { teamId: 1 } },
    );
    await waitFor(() => expect(result.current.data?.[0].id).toBe(1));
    rerender({ teamId: 2 });
    await waitFor(() => expect(result.current.data?.[0].id).toBe(2));
    unmount();
    await new Promise((resolve) => {
      setTimeout(resolve, 30);
    });
    expect(db.posts.local().getSnapshot().data).toStrictEqual([]);
  });

  it("refetches and loads the next page", async () => {
    const { db, getPage } = setup;
    mockRequest(getPage, { data: { items: [{ id: 1, teamId: 1, title: "One" }], next: "2" } });
    const { result } = renderHook(() => useLiveQuery(db.pages.findOne(1).local()));
    const pages = renderHook(() => useLiveQuery(db.pages.select((post) => ({ id: post.id }))));
    await waitFor(() => expect(pages.result.current.hasNextPage).toBeTrue());
    expect(result.current.data?.id).toBe(1);

    mockRequest(getPage, { data: { items: [{ id: 2, teamId: 1, title: "Two" }], next: null } });
    await act(() => pages.result.current.fetchNextPage());
    expect(pages.result.current.data).toStrictEqual([{ id: 1 }, { id: 2 }]);
    await act(() => pages.result.current.refetch());
    expect(pages.result.current.hasNextPage).toBeFalse();
  });

  it("keeps the other rows' identity when one row changes", async () => {
    const { db, getTeamPosts, updatePost } = setup;
    mockRequest(getTeamPosts.setParams({ teamId: 1 }), {
      data: [
        { id: 1, teamId: 1, title: "One" },
        { id: 2, teamId: 1, title: "Two" },
      ],
    });
    const { result } = renderHook(() => useLiveQuery(db.posts.where((post) => eq(post.teamId, 1))));
    await waitFor(() => expect(result.current.data).toHaveLength(2));
    const [first, second] = result.current.data!;
    mockRequest(updatePost.setParams({ postId: 2 }), { data: { id: 2, teamId: 1, title: "Changed" }, delay: 20 });
    act(() => {
      db.posts.update(2, { title: "Changed" });
    });
    expect(result.current.data?.[0]).toBe(first);
    expect(result.current.data?.[1]).not.toBe(second);
  });

  it("goes from loading to ready with no rows, and stays ready while it refetches", async () => {
    const { db, getTeamPosts } = setup;
    mockRequest(getTeamPosts.setParams({ teamId: 1 }), { data: [] });
    const statuses: string[] = [];
    const { result } = renderHook(() => {
      const state = useLiveQuery(db.posts.where((post) => eq(post.teamId, 1)));
      statuses.push(state.status);
      return state;
    });
    await waitFor(() => expect(result.current).toMatchObject({ status: "ready", data: [] }));
    mockRequest(getTeamPosts.setParams({ teamId: 1 }), { data: [{ id: 1, teamId: 1, title: "One" }], delay: 10 });
    await act(() => result.current.refetch());
    expect(result.current.data).toHaveLength(1);
    expect(statuses.slice(statuses.indexOf("ready"))).not.toContain("loading");
  });

  it("renders a query its db already holds as ready on the first render", async () => {
    const { db, getTeamPosts } = setup;
    mockRequest(getTeamPosts.setParams({ teamId: 1 }), { data: [{ id: 1, teamId: 1, title: "One" }] });
    await db.posts.where((post) => eq(post.teamId, 1)).get();
    const renders: string[] = [];
    renderHook(() => {
      const state = useLiveQuery(db.posts.where((post) => eq(post.teamId, 1)));
      renders.push(state.status);
      return state;
    });
    expect(renders[0]).toBe("ready");
  });

  it("never renders both keys or an empty frame when an insert's temporary key becomes the server's", async () => {
    const client = createClient({ url: "http://localhost:3000" });
    const getTeamPosts = client.createRequest<{ response: Post[] }>()({ endpoint: "/teams/:teamId/posts" });
    const createPost = client.createRequest<{ response: Post; payload: Omit<Post, "id"> }>()({
      endpoint: "/posts",
      method: "POST",
    });
    const Posts = collection(rowType<Post>(), { key: "id" })
      .load(getTeamPosts, { where: { teamId: { eq: (teamId) => ({ params: { teamId } }), required: true } } })
      .mutate({ insert: { request: createPost, map: (row) => ({ payload: row }) } });
    const db = createDb({ posts: Posts });
    mockRequest(getTeamPosts.setParams({ teamId: 1 }), { data: [] });
    mockRequest(createPost, { data: { id: 100, teamId: 1, title: "New" }, delay: 10 });
    const frames: (number | string)[][] = [];
    const { result } = renderHook(() => {
      const state = useLiveQuery(db.posts.where((post) => eq(post.teamId, 1)));
      frames.push(state.data?.map((post) => post.id) ?? []);
      return { state, renderKey: state.data?.[0] ? db.posts.renderKey(state.data[0].id) : undefined };
    });
    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    let insert: Promise<unknown> | undefined;
    act(() => {
      insert = db.posts.insert({ teamId: 1, title: "New" } as Post);
    });
    const temporary = result.current.renderKey;
    await act(async () => {
      await insert;
    });
    expect(result.current.state.data?.map((post) => post.id)).toStrictEqual([100]);
    expect(result.current.renderKey).toBe(temporary);
    const afterInsert = frames.slice(frames.findIndex((frame) => frame.length > 0));
    expect(afterInsert.every((frame) => frame.length === 1)).toBeTrue();
    db.destroy();
  });

  it("survives the double mount of StrictMode", async () => {
    const { db, getTeamPosts } = setup;
    mockRequest(getTeamPosts.setParams({ teamId: 1 }), { data: [{ id: 1, teamId: 1, title: "One" }] });
    const { result } = renderHook(() => useLiveQuery(db.posts.where((post) => eq(post.teamId, 1))), {
      wrapper: StrictMode,
    });
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.data).toHaveLength(1);
  });

  it("does not compile for a query no loader can serve", () => {
    const { db } = setup;
    const useUnservableQuery = () => {
      // @ts-expect-error the team list needs `teamId`
      useLiveQuery(db.posts.select((post) => ({ id: post.id })));
    };
    expect(useUnservableQuery).toBeFunction();
  });
});
