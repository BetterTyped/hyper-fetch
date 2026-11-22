import { relayConnection } from "@hyper-fetch/db";
import type { RelayConnection } from "@hyper-fetch/db";

type Post = { id: string };
type Response = { posts: RelayConnection<Post> };

describe("relayConnection", () => {
  const { rows, cursor } = relayConnection((response: Response) => response.posts);

  it("reads the nodes of a connection and skips empty edges", () => {
    const response: Response = {
      posts: { edges: [{ node: { id: "a" } }, null], pageInfo: { hasNextPage: true, endCursor: "a" } },
    };
    expect(rows(response)).toStrictEqual([{ id: "a" }]);
    expect(cursor(response)).toBe("a");
  });

  it("has no next cursor on the last page or without an end cursor", () => {
    expect(cursor({ posts: { edges: [], pageInfo: { hasNextPage: false, endCursor: "z" } } })).toBeNull();
    expect(cursor({ posts: { edges: null, pageInfo: { hasNextPage: true } } })).toBeNull();
    expect(rows({ posts: { edges: null, pageInfo: { hasNextPage: true } } })).toStrictEqual([]);
  });
});
