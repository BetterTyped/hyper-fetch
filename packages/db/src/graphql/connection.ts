/** A Relay connection, the shape many GraphQL APIs use for paginated lists */
export type RelayConnection<Node> = {
  edges?: readonly ({ node: Node } | null)[] | null;
  pageInfo: { hasNextPage: boolean; endCursor?: string | null };
};

/**
 * Reads the rows and the next cursor of a Relay connection (`edges` / `node`), for a paginated GraphQL loader. Spread it
 * into the loader options and add `page` to send the cursor.
 *
 * @example
 * collection(PostSchema, { key: "id" }).load(getPosts, {
 *   ...relayConnection((response: PostsResponse) => response.posts),
 *   page: (after) => ({ payload: { after } }),
 * });
 */
export const relayConnection = <Response, Node>(select: (response: Response) => RelayConnection<Node>) => ({
  rows: (response: Response): Node[] => (select(response).edges ?? []).flatMap((edge) => (edge ? [edge.node] : [])),
  cursor: (response: Response): string | null => {
    const { pageInfo } = select(response);
    return pageInfo.hasNextPage ? (pageInfo.endCursor ?? null) : null;
  },
});
