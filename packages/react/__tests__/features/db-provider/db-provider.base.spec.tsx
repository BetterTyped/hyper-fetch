import { createClient } from "@hyper-fetch/core";
import { collection, createDb, eq, rowType } from "@hyper-fetch/db";
import type { DbOptions } from "@hyper-fetch/db";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { renderHook, waitFor } from "@testing-library/react";
import { useLiveQuery } from "hooks/use-live-query";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { expectTypeOf } from "vitest";

import { DbProvider, useDb } from "../../../src/db-provider";

const { startServer, stopServer, resetMocks, mockRequest } = createHttpMockingServer();

type Post = { id: number; teamId: number; title: string };

const createCollections = () => {
  const client = createClient({ url: "http://localhost:3000" });
  const getTeamPosts = client.createRequest<{ response: Post[] }>()({ endpoint: "/teams/:teamId/posts" });
  const post = collection(rowType<Post>(), { key: "id" }).load(getTeamPosts, {
    where: { teamId: { eq: (teamId) => ({ params: { teamId } }), required: true } },
  });
  return { collections: { post }, getTeamPosts };
};

const createAppDb = (options?: DbOptions) => createDb(createCollections().collections, options);
type AppDb = ReturnType<typeof createAppDb>;

const useTeamTitles = () => {
  const db = useDb<AppDb>();
  const { data, status } = useLiveQuery(db.post.where((post) => eq(post.teamId, 1)));
  return { titles: data?.map((post) => post.title), status };
};

describe("DbProvider [ Base ]", () => {
  beforeAll(() => startServer());
  beforeEach(() => resetMocks());
  afterAll(() => stopServer());

  it("gives components the db of the nearest provider", async () => {
    const { getTeamPosts } = createCollections();
    mockRequest(getTeamPosts.setParams({ teamId: 1 }), { data: [{ id: 1, teamId: 1, title: "One" }] });
    const db = createAppDb();
    const wrapper = ({ children }: { children: ReactNode }) => <DbProvider db={db}>{children}</DbProvider>;
    const { result } = renderHook(() => useTeamTitles(), { wrapper });
    await waitFor(() => expect(result.current.titles).toStrictEqual(["One"]));
    expectTypeOf(useDb<AppDb>).returns.toEqualTypeOf<AppDb>();
    db.destroy();
  });

  it("renders the server's rows on the first client render after hydration", async () => {
    const { getTeamPosts } = createCollections();
    mockRequest(getTeamPosts.setParams({ teamId: 1 }), { data: [{ id: 1, teamId: 1, title: "From server" }] });
    const serverDb = createAppDb();
    await serverDb.post.where((post) => eq(post.teamId, 1)).get();
    const Titles = () => <p>{useTeamTitles().titles?.join(",") ?? "loading"}</p>;
    const html = renderToString(
      <DbProvider db={serverDb}>
        <Titles />
      </DbProvider>,
    );
    expect(html).toContain("From server");

    const clientDb = createAppDb({ state: serverDb.dehydrate() });
    const wrapper = ({ children }: { children: ReactNode }) => <DbProvider db={clientDb}>{children}</DbProvider>;
    const renders: ReturnType<typeof useTeamTitles>[] = [];
    renderHook(
      () => {
        const value = useTeamTitles();
        renders.push(value);
        return value;
      },
      { wrapper },
    );
    expect(renders[0]).toStrictEqual({ titles: ["From server"], status: "ready" });
    serverDb.destroy();
    clientDb.destroy();
  });

  it("fails clearly without a provider", () => {
    expect(() => renderHook(() => useDb())).toThrow("useDb needs a DbProvider");
  });
});
