"use client";

import { Hydrate, type HydrateProps, useFetch } from "@hyper-fetch/react";
import { useState } from "react";

import { client, getPostComments, latestPosts } from "@/lib/api";

const Comments = ({ postId }: { postId: number }) => {
  // Not part of the server render: this request starts in the browser when a post is opened.
  const { data, error, loading } = useFetch(getPostComments.setParams({ postId }));

  if (loading && !data) return <p aria-busy="true">Loading comments in the browser...</p>;
  if (error) return <p className="error">Could not load comments: {error.message}</p>;
  if (!data?.comments.length) return <p className="muted">No comments.</p>;

  return (
    <ul>
      {data.comments.map((comment) => (
        <li key={comment.id}>
          <strong>@{comment.user.username}</strong> {comment.body}
        </li>
      ))}
    </ul>
  );
};

const PostList = () => {
  const [opened, setOpened] = useState<number[]>([]);
  // The first render already has the server data: no loading state and, while it is fresh, no request.
  const { data, error, loading, refetch } = useFetch(latestPosts, { revalidate: false });

  if (loading && !data) return <p aria-busy="true">Loading posts...</p>;
  if (error) return <p className="error">Could not load posts: {error.message}</p>;

  return (
    <section>
      <header className="toolbar muted">
        <span>{data?.posts.length} posts, rendered with the HTML</span>
        <button type="button" className="outline secondary" onClick={refetch} disabled={loading}>
          Refetch in the browser
        </button>
      </header>
      {data?.posts.map((post) => (
        <article key={post.id}>
          <header>
            <strong>{post.title}</strong>
            <br />
            <small className="muted">
              {post.views} views · {post.tags.join(", ")}
            </small>
          </header>
          <p>{post.body}</p>
          <details onToggle={(event) => event.currentTarget.open && setOpened((prev) => [...prev, post.id])}>
            <summary>Comments</summary>
            {opened.includes(post.id) && <Comments postId={post.id} />}
          </details>
        </article>
      ))}
    </section>
  );
};

/** `Hydrate` writes the server responses into the client cache before the hooks below it mount. */
export const Posts = ({ hydration }: { hydration: HydrateProps["data"] }) => (
  <Hydrate client={client} data={hydration}>
    <PostList />
  </Hydrate>
);
