import { useState } from "react";
import type { FormEvent } from "react";

// Components import hooks only. They do not know about the client, requests or cache keys.
import { usePost, usePosts, useRenamePost } from "./hooks";

const PostList = ({ selected, onSelect }: { selected: number | null; onSelect: (id: number) => void }) => {
  const { data, error, loading } = usePosts();

  if (loading && !data) return <p aria-busy="true">Loading posts...</p>;
  if (error) return <p className="error">Could not load posts: {error.message}</p>;

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

const RenameForm = ({ postId, title }: { postId: number; title: string }) => {
  const { renamePost, submitting, error } = useRenamePost(postId);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newTitle = String(new FormData(event.currentTarget).get("title") ?? "").trim();
    if (!newTitle) return;

    // `submit` resolves with the response, so the form can react to the result.
    const { success } = await renamePost(newTitle);
    if (success) setSaved(true);
  };

  return (
    <form onSubmit={handleSubmit} onChange={() => setSaved(false)}>
      <fieldset role="group">
        <input name="title" defaultValue={title} aria-label="Post title" />
        <button type="submit" aria-busy={submitting} disabled={submitting}>
          Rename
        </button>
      </fieldset>
      {saved && <small className="success">Saved. The list shows the new title too.</small>}
      {error && <small className="error">Could not save: {error.message}</small>}
    </form>
  );
};

const PostDetails = ({ postId }: { postId: number }) => {
  const { data, error, loading } = usePost(postId);

  if (loading && !data) return <article aria-busy="true">Loading post...</article>;
  if (error) return <article className="error">Could not load the post: {error.message}</article>;
  if (!data) return null;

  return (
    <article>
      <header>
        <strong>{data.title}</strong>
      </header>
      <p>{data.body}</p>
      <footer>
        <RenameForm key={postId} postId={postId} title={data.title} />
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
        <p>Every component below calls one custom hook: usePosts, usePost or useRenamePost.</p>
      </hgroup>
      <div className="grid-2">
        <PostList selected={selected} onSelect={setSelected} />
        {selected ? <PostDetails postId={selected} /> : <p className="muted">No post selected.</p>}
      </div>
    </main>
  );
};
