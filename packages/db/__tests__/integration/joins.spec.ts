import { collection, createDb, eq, rowType } from "@hyper-fetch/db";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { z } from "zod";

import type { PostSummary } from "../utils/fixtures";
import {
  PostSchema,
  PostSummarySchema,
  createApi,
  createHttpClient,
  createPost,
  createRequests,
  toSummary,
} from "../utils/fixtures";

const { server, startServer, stopServer, resetMocks } = createHttpMockingServer();

const TeamSchema = z.object({ id: z.number(), name: z.string() });

const byTeam = { teamId: { eq: (teamId: number) => ({ params: { teamId } }), required: true as const } };

const setup = () => {
  const client = createHttpClient();
  const requests = createRequests(client);
  const getTeams = client.createRequest<{ response: z.infer<typeof TeamSchema>[]; queryParams?: { ids?: number[] } }>()(
    { endpoint: "/teams-by-ids" },
  );
  const updateTeam = client.createRequest<{ response: z.infer<typeof TeamSchema> }>()({
    endpoint: "/teams/:teamId",
    method: "PATCH",
  });
  const api = createApi(server);
  const Team = collection(TeamSchema, { key: "id" })
    .load(getTeams, { byKeys: (ids) => ({ queryParams: { ids } }) })
    .ingest(updateTeam, { type: "update" });
  const LocalTeam = collection(TeamSchema, { key: "id" }).ingest(updateTeam);
  const updateSummary = client.createRequest<{ response: PostSummary }>()({
    endpoint: "/summaries/:postId",
    method: "PATCH",
  });
  const getMembers = client.createRequest<{ response: { id: number; teamId: number | null }[] }>()({
    endpoint: "/members",
  });
  const Summary = collection(PostSummarySchema, { key: "id" })
    .load(requests.getTeamPosts, { where: byTeam })
    .ingest(updateSummary, { type: "update" });
  const Member = collection(rowType<{ id: number; teamId: number | null }>(), { key: "id" }).load(getMembers);
  const Post = collection(PostSchema, { key: "id" }).load(requests.getPost, {
    byKey: (id) => ({ params: { postId: id } }),
  });
  const db = createDb(
    { team: Team, localTeam: LocalTeam, postSummary: Summary, post: Post, member: Member },
    { gcTime: 0 },
  );
  return { api, db, updateTeam, updateSummary };
};

const teamIds = (url: URL) =>
  [...url.searchParams.getAll("ids[]"), ...url.searchParams.getAll("ids")].flatMap((value) => value.split(","));

describe("db [ Joins ]", () => {
  let context = setup();

  beforeAll(() => startServer());
  beforeEach(() => {
    resetMocks();
    context = setup();
    context.api.get("/teams-by-ids", ({ url }) => ({
      data: teamIds(url)
        .filter((id) => id !== "404")
        .map((id) => ({ id: Number(id), name: `Team ${id}` })),
    }));
  });
  afterEach(() => context.db.destroy());
  afterAll(() => stopServer());

  it("loads joined rows in one batch and keeps them live", async () => {
    const { api, db, updateTeam } = context;
    api.get("/teams/:teamId/posts", () => ({
      data: [createPost(1, { teamId: 1 }), createPost(2, { teamId: 1 })].map(toSummary),
    }));
    api.patch("/teams/:teamId", ({ params }) => ({ data: { id: Number(params.teamId), name: "Renamed" } }));
    const query = db.postSummary
      .where((post) => eq(post.teamId, 1))
      .select((post) => ({ id: post.id, teamId: post.teamId }))
      .join("team", db.team, (post) => post.teamId);
    const unsubscribe = query.subscribe(() => {});
    await vi.waitFor(() => expect(query.getSnapshot().data?.[0].team).toBeDefined());
    expect(query.getSnapshot().data).toStrictEqual([
      { id: 1, teamId: 1, team: { id: 1, name: "Team 1" } },
      { id: 2, teamId: 1, team: { id: 1, name: "Team 1" } },
    ]);
    expect(api.callsTo("/teams-by-ids")).toHaveLength(1);

    const before = query.getSnapshot().data;
    await updateTeam.setParams({ teamId: 1 }).send();
    expect(query.getSnapshot().data?.map((post) => post.team?.name)).toStrictEqual(["Renamed", "Renamed"]);
    expect(query.getSnapshot().data?.[0]).not.toBe(before?.[0]);
    unsubscribe();
  });

  it("joins a row that is missing as undefined and loads new keys when the result changes", async () => {
    const { api, db } = context;
    api.get("/posts/:postId", ({ params }) => ({ data: createPost(Number(params.postId), { teamId: 404 }) }));
    const query = db.post.findOne(5).join("team", db.team, (post) => post.teamId);
    const unsubscribe = query.subscribe(() => {});
    await vi.waitFor(() => expect(query.getSnapshot().data?.id).toBe(5));
    await vi.waitFor(() => expect(api.callsTo("/teams-by-ids")).toHaveLength(1));
    expect(query.getSnapshot().data?.team).toBeUndefined();

    api.get("/posts/:postId", ({ params }) => ({ data: createPost(Number(params.postId), { teamId: 2 }) }));
    await query.refetch();
    await vi.waitFor(() => expect(query.getSnapshot().data?.team).toStrictEqual({ id: 2, name: "Team 2" }));
    unsubscribe();
  });

  it("reads joined rows the db holds when the joined collection has no key loader", async () => {
    const { api, db, updateTeam } = context;
    api.get("/teams/:teamId/posts", () => ({ data: [createPost(1, { teamId: 3 })].map(toSummary) }));
    api.patch("/teams/:teamId", ({ params }) => ({ data: { id: Number(params.teamId), name: "Held" } }));
    const query = db.postSummary
      .where((post) => eq(post.teamId, 3))
      .join("team", db.localTeam, (post) => post.teamId)
      .join("loaded", db.team, (post) => post.teamId);
    const unsubscribe = query.subscribe(() => {});
    await vi.waitFor(() => expect(query.getSnapshot().data?.[0].loaded).toBeDefined());
    expect(query.getSnapshot().data?.[0].team).toBeUndefined();
    await updateTeam.setParams({ teamId: 3 }).send();
    expect(query.getSnapshot().data?.[0].team).toStrictEqual({ id: 3, name: "Held" });
    expect(db.team.findOne(3).local().getSnapshot().data).toStrictEqual({ id: 3, name: "Held" });
    unsubscribe();
    await vi.waitFor(() => expect(db.team.findOne(3).local().getSnapshot().data).toBeUndefined());
  });

  it("releases joined rows that leave the result and skips rows without a foreign key", async () => {
    const { api, db, updateSummary } = context;
    api.get("/teams/:teamId/posts", () => ({
      data: [createPost(1, { teamId: 1 }), createPost(2, { teamId: 1 })].map(toSummary),
    }));
    api.patch("/summaries/:postId", ({ params }) => ({
      data: toSummary(createPost(Number(params.postId), { teamId: 1, archived: true })),
    }));
    api.get("/members", () => ({
      data: [
        { id: 1, teamId: null },
        { id: 2, teamId: 7 },
      ],
    }));
    const query = db.postSummary
      .where((post) => eq(post.teamId, 1))
      .where((post) => eq(post.archived, false))
      .join("team", db.team, (post) => post.likes);
    const members = db.member.join("team", db.team, (member) => member.teamId);
    const unsubscribes = [query.subscribe(() => {}), members.subscribe(() => {})];
    await vi.waitFor(() => expect(query.getSnapshot().data?.[1]?.team).toStrictEqual({ id: 2, name: "Team 2" }));
    await vi.waitFor(() => expect(members.getSnapshot().data?.[1]?.team).toBeDefined());
    expect(members.getSnapshot().data).toStrictEqual([
      { id: 1, teamId: null, team: undefined },
      { id: 2, teamId: 7, team: { id: 7, name: "Team 7" } },
    ]);

    await updateSummary.setParams({ postId: 2 }).send();
    expect(query.getSnapshot().data?.map((post) => post.id)).toStrictEqual([1]);
    await vi.waitFor(() => expect(db.team.findOne(2).local().getSnapshot().data).toBeUndefined());
    expect(db.team.findOne(1).local().getSnapshot().data).toBeDefined();
    unsubscribes.forEach((unsubscribe) => unsubscribe());
  });

  it("does not load joined rows for a local query", async () => {
    const { api, db } = context;
    api.get("/teams/:teamId/posts", () => ({ data: [createPost(1, { teamId: 1 })].map(toSummary) }));
    await db.postSummary.where((post) => eq(post.teamId, 1)).get();
    const query = db.postSummary.local().join("team", db.team, (post) => post.teamId);
    const unsubscribe = query.subscribe(() => {});
    expect(query.getSnapshot().data).toStrictEqual([{ ...toSummary(createPost(1)), team: undefined }]);
    expect(api.callsTo("/teams-by-ids")).toHaveLength(0);
    unsubscribe();
  });
});
