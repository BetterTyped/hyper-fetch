import { useFetch, useSubmit } from "@hyper-fetch/react";
import type { FormEvent } from "react";
import { useState } from "react";

import { sdk } from "./api";

const PostList = ({ selected, onSelect }: { selected: number | null; onSelect: (id: number) => void }) => {
  // `sdk.posts.$get` is a regular Request, so every request method and hook works with it.
  // `select` is a dummyjson query param: the API returns only these fields.
  const { data, error, loading } = useFetch(sdk.posts.$get.setQueryParams({ limit: 8, select: "title" }));

  if (loading && !data) return <p aria-busy="true">Loading posts...</p>;
  if (error) return <p>Could not load posts: {error.message}</p>;

  return (
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
  );
};

const PostDetails = ({ postId }: { postId: number }) => {
  // `$postId` in the schema becomes a typed `:postId` param.
  const { data, error, loading } = useFetch(sdk.posts.$postId.$get.setParams({ postId }));

  if (loading && !data) return <article aria-busy="true">Loading post...</article>;
  if (error) return <article>Could not load the post: {error.message}</article>;
  if (!data) return null;

  return (
    <article>
      <header>
        <h3>{data.title}</h3>
        <small className="muted">
          {data.reactions.likes} likes · {data.reactions.dislikes} dislikes
        </small>
      </header>
      <p>{data.body}</p>
    </article>
  );
};

const NewPostForm = () => {
  const { submit, submitting, data, error } = useSubmit(sdk.posts.add.$post);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    // The payload type comes from the schema: a missing `userId` is a compile error.
    submit({ payload: { title: String(form.get("title")), body: String(form.get("body")), userId: 1 } });
  };

  return (
    <article>
      <form onSubmit={handleSubmit}>
        <input name="title" placeholder="Title" aria-label="Title" required />
        <textarea name="body" placeholder="What is on your mind?" aria-label="Body" rows={3} required />
        <button type="submit" aria-busy={submitting} disabled={submitting}>
          Add post
        </button>
      </form>
      {error && <p>Could not add the post: {error.message}</p>}
      {data && (
        <p>
          Created post <mark>#{data.id}</mark> "{data.title}". dummyjson simulates writes, so it does not show up in the
          list.
        </p>
      )}
    </article>
  );
};

export const App = () => {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <main className="container">
      <hgroup>
        <h1>Posts SDK</h1>
        <p>
          Every request below comes from one typed object: <code>sdk.posts.$get</code>,{" "}
          <code>sdk.posts.$postId.$get</code> and <code>sdk.posts.add.$post</code>.
        </p>
      </hgroup>
      <div className="grid-2">
        <section>
          <h2>Posts</h2>
          <PostList selected={selected} onSelect={setSelected} />
        </section>
        <section>
          <h2>Details</h2>
          {selected ? <PostDetails postId={selected} /> : <p className="muted">No post selected.</p>}
          <h2>New post</h2>
          <NewPostForm />
        </section>
      </div>
    </main>
  );
};
