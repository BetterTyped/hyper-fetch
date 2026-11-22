import { collection, createDb, eq } from "@hyper-fetch/db";
import type { StandardSchemaV1 } from "@hyper-fetch/db";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { z } from "zod";

import { createApi, createHttpClient } from "../utils/fixtures";

const { server, startServer, stopServer, resetMocks } = createHttpMockingServer();

const UserSchema = z.object({ id: z.number(), name: z.string().min(1) });
const PostSchema = z.object({ id: z.number(), teamId: z.number(), title: z.string(), author: UserSchema.nullable() });
type User = z.infer<typeof UserSchema>;
type Post = z.infer<typeof PostSchema>;

const asyncUserSchema: StandardSchemaV1<User, User> = {
  "~standard": {
    version: 1,
    vendor: "test",
    validate: async (value) => ({ value: value as User }),
  },
};

const post = (id: number, author: User | null): Post => ({ id, teamId: 1, title: `Post ${id}`, author });

const setup = () => {
  const client = createHttpClient();
  const api = createApi(server);
  const getTeamPosts = client.createRequest<{ response: Post[] }>()({ endpoint: "/teams/:teamId/posts" });
  const getUsers = client.createRequest<{ response: User[] }>()({ endpoint: "/users" });
  const createPostRequest = client.createRequest<{ response: Post; payload: Post }>()({
    endpoint: "/posts",
    method: "POST",
  });
  const User = collection(UserSchema, { key: "id", validate: "all" }).load(getUsers);
  const Reviewer = collection(asyncUserSchema, { key: "id", validate: "all" }).load(getUsers);
  const Post = collection(PostSchema, { key: "id" })
    .load(getTeamPosts, { where: { teamId: { eq: (teamId) => ({ params: { teamId } }), required: true } } })
    .normalize(User, (row) => (row.author ? [row.author] : []))
    .normalize(Reviewer, (row) => (row.author ? [row.author] : []))
    .mutate({ insert: { request: createPostRequest, map: (row) => ({ payload: row }) } });
  const db = createDb({ user: User, reviewer: Reviewer, post: Post });
  return { api, db, Post };
};

describe("db [ Normalizing on ingest ]", () => {
  beforeAll(() => startServer());
  beforeEach(() => resetMocks());
  afterAll(() => stopServer());

  it("writes nested rows of loads and mutation responses into their collections", async () => {
    const { api, db } = setup();
    api.get("/teams/:teamId/posts", () => ({
      data: [post(1, { id: 10, name: "Ada" }), post(2, null), post(3, { id: 11, name: "" })],
    }));
    api.post("/posts", ({ body }) => ({ data: body }));
    const errors: unknown[] = [];
    db.onError((event) => errors.push(event));

    const posts = db.post.where((row) => eq(row.teamId, 1));
    const users = db.user.local();
    const reviewers = db.reviewer.local();
    const stops = [posts.subscribe(() => {}), users.subscribe(() => {}), reviewers.subscribe(() => {})];
    await vi.waitFor(() => expect(posts.getSnapshot().status).toBe("ready"));
    expect(users.getSnapshot().data).toStrictEqual([{ id: 10, name: "Ada" }]);
    expect(errors).toHaveLength(1);
    await vi.waitFor(() => expect(reviewers.getSnapshot().data).toHaveLength(2));

    await db.post.insert(post(4, { id: 12, name: "Grace" }));
    expect(users.getSnapshot().data?.map((user) => user.name)).toStrictEqual(["Ada", "Grace"]);
    stops.forEach((stop) => stop());
    db.destroy();
  });

  it("fails at createDb when a collection normalizes into one the db does not hold", () => {
    const { Post } = setup();
    expect(() => createDb({ post: Post })).toThrow(
      '"post" normalizes into a collection that was not passed to createDb',
    );
  });
});
