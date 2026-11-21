import { useFetch } from "@hyper-fetch/react";
import { useState } from "react";

import { getPost, getPostComments, getPosts } from "./api";

const PostList = ({ selected, onSelect }: { selected: number | null; onSelect: (id: number) => void }) => {
  // The request is sent on mount. Data, error and loading state come from the shared cache.
  // `select` is a dummyjson query param: the API returns only these fields.
  const { data, error, loading, refetch } = useFetch(getPosts.setQueryParams({ limit: 10, select: "title" }));

  if (loading && !data) return <p aria-busy="true">Loading posts...</p>;
  if (error) return <p>Could not load posts: {error.message}</p>;

  return (
    <section>
      <header className="toolbar muted">
        <span>
          Showing {data?.posts.length} of {data?.total} posts
        </span>
        <button type="button" className="outline secondary" onClick={refetch} disabled={loading}>
          Refresh
        </button>
      </header>
      <ul className="list">
        {data?.posts.map((post) => (
          <li key={post.id}>
            <button
              type="button"
              className={post.id === selected ? undefined : "outline secondary"}
              onClick={() => onSelect(post.id)}
            >
              {post.title}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};

const PostDetails = ({ postId }: { postId: number }) => {
  // Changing `postId` creates a new cache key, so every post is fetched once and then served from cache.
  const post = useFetch(getPost.setParams({ postId }));
  const comments = useFetch(getPostComments.setParams({ postId }));

  if (post.loading && !post.data) return <article aria-busy="true">Loading post...</article>;
  if (post.error) return <article>Could not load the post: {post.error.message}</article>;
  if (!post.data) return null;

  return (
    <article>
      <header>
        <h3>{post.data.title}</h3>
        <small className="muted">
          {post.data.views} views · {post.data.reactions.likes} likes · {post.data.tags.join(", ")}
        </small>
      </header>
      <p>{post.data.body}</p>
      <footer>
        <h6>Comments</h6>
        {comments.loading && <p aria-busy="true">Loading comments...</p>}
        {comments.data?.comments.map((comment) => (
          <p key={comment.id}>
            <strong>@{comment.user.username}</strong> {comment.body}
          </p>
        ))}
      </footer>
    </article>
  );
};

export const App = () => {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <main className="container">
      <hgroup>
        <h1>Posts</h1>
        <p>Pick a post. Posts you already opened load instantly from the cache.</p>
      </hgroup>
      <div className="grid-2">
        <PostList selected={selected} onSelect={setSelected} />
        {selected ? <PostDetails postId={selected} /> : <p className="muted">No post selected.</p>}
      </div>
    </main>
  );
};
