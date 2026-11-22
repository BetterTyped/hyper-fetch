import { Client } from "@hyper-fetch/core";
import { collection, createDb, eq, relayConnection, rowType } from "@hyper-fetch/db";
import type { RelayConnection } from "@hyper-fetch/db";
import { createGraphqlMockingServer } from "@hyper-fetch/testing";
import { GraphqlAdapter } from "adapter";
import { HttpResponse, graphql } from "msw";

const { server, startServer, stopServer, resetMocks } = createGraphqlMockingServer();

type Post = { id: string; teamId: number; title: string };
type PostsResponse = { posts: RelayConnection<Post> };
type PostsVariables = { teamId: number; after?: string };

const postsQuery = `query Posts($teamId: Int!, $after: String) {
  posts(teamId: $teamId, after: $after) { edges { node { id teamId title } } pageInfo { hasNextPage endCursor } }
}`;

const posts: Post[] = [
  { id: "a", teamId: 1, title: "First" },
  { id: "b", teamId: 1, title: "Second" },
  { id: "c", teamId: 1, title: "Third" },
];

describe("GraphQL [ @hyper-fetch/db loaders ]", () => {
  beforeAll(() => startServer());
  beforeEach(() => resetMocks());
  afterAll(() => stopServer());

  it("loads a paginated GraphQL connection with filters mapped to variables", async () => {
    const client = new Client({ url: "http://localhost:4000/graphql" }).setAdapter(GraphqlAdapter());
    const getPosts = client.createRequest<{ response: PostsResponse; payload: PostsVariables }>()({
      endpoint: postsQuery,
    });
    const Post = collection(rowType<Post>(), { key: "id" }).load(getPosts, {
      ...relayConnection((response: PostsResponse) => response.posts),
      page: (after) => ({ payload: { after } }),
      where: { teamId: { eq: (teamId) => ({ payload: { teamId } }), required: true } },
    });
    const db = createDb({ post: Post });

    const variables: PostsVariables[] = [];
    server.use(
      graphql.query("Posts", ({ variables: received }) => {
        variables.push(received as PostsVariables);
        const start = received.after ? posts.findIndex((post) => post.id === received.after) + 1 : 0;
        const page = posts.slice(start, start + 2);
        const hasNextPage = start + 2 < posts.length;
        return HttpResponse.json({
          data: {
            posts: {
              edges: [...page.map((node) => ({ node })), null],
              pageInfo: { hasNextPage, endCursor: hasNextPage ? page.at(-1)!.id : null },
            },
          },
        });
      }),
    );

    const query = db.post.where((post) => eq(post.teamId, 1));
    const unsubscribe = query.subscribe(() => {});
    await vi.waitFor(() => expect(query.getSnapshot().status).toBe("ready"));
    expect(query.getSnapshot()).toMatchObject({ hasNextPage: true, data: [{ id: "a" }, { id: "b" }] });

    await query.fetchNextPage();
    expect(query.getSnapshot()).toMatchObject({ hasNextPage: false });
    expect(query.getSnapshot().data?.map((post) => post.id)).toStrictEqual(["a", "b", "c"]);
    expect(variables).toStrictEqual([{ teamId: 1 }, { teamId: 1, after: "b" }]);
    unsubscribe();
    db.destroy();
  });

  it("reads an empty connection", () => {
    const { rows, cursor } = relayConnection((response: PostsResponse) => response.posts);
    const empty: PostsResponse = { posts: { edges: null, pageInfo: { hasNextPage: true } } };
    expect(rows(empty)).toStrictEqual([]);
    expect(cursor(empty)).toBeNull();
  });
});
