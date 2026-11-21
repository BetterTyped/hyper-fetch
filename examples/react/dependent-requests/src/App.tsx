import { useFetch } from "@hyper-fetch/react";
import { useState } from "react";

import { findUser, getUserPosts, getUserTodos } from "./api";

const usernames = ["emilys", "michaelw", "sophiab", "oliviaw", "ghost"];

type StepProps = { label: string; disabled: boolean; loading: boolean; failed: boolean };

/** Shows where each request is in the chain. */
const Step = ({ label, disabled, loading, failed }: StepProps) => {
  let state = "done";
  if (disabled) state = "waiting";
  else if (loading) state = "loading";
  else if (failed) state = "failed";

  return (
    <li>
      <code>{label}</code> <mark className={`step ${state}`}>{state}</mark>
    </li>
  );
};

export const App = () => {
  const [username, setUsername] = useState(usernames[0]);

  // "clean" drops the previous user while the next one loads, so the steps below go back to waiting.
  const user = useFetch(
    findUser.setQueryParams({ key: "username", value: username, select: "firstName,lastName,email", delay: 700 }),
    { keepPreviousData: "clean" },
  );
  const userId = user.data?.users[0]?.id;

  // The params need a value even while disabled. Nothing is sent until `disabled` turns false.
  const posts = useFetch(getUserPosts.setParams({ userId: userId ?? 0 }), { disabled: !userId });
  const todos = useFetch(getUserTodos.setParams({ userId: userId ?? 0 }), { disabled: !userId });

  const profile = user.data?.users[0];

  return (
    <main className="container">
      <hgroup>
        <h1>Dependent requests</h1>
        <p>Posts and todos need the user id, so they wait until the user lookup returns it.</p>
      </hgroup>

      <div role="group">
        {usernames.map((name) => (
          <button
            key={name}
            type="button"
            className={name === username ? undefined : "outline secondary"}
            onClick={() => setUsername(name)}
          >
            {name}
          </button>
        ))}
      </div>

      <ol className="steps">
        <Step label="GET /users/filter" disabled={false} loading={user.loading} failed={!!user.error} />
        <Step label="GET /posts/user/:userId" disabled={!userId} loading={posts.loading} failed={!!posts.error} />
        <Step label="GET /todos/user/:userId" disabled={!userId} loading={todos.loading} failed={!!todos.error} />
      </ol>

      {user.loading && <article aria-busy="true">Looking up {username}...</article>}
      {user.error && <article>Could not load the user: {user.error.message}</article>}
      {user.data && !profile && <article>No user is called "{username}", so nothing else is fetched.</article>}

      {profile && (
        <article>
          <header>
            <h3>
              {profile.firstName} {profile.lastName}
            </h3>
            <small className="muted">{profile.email}</small>
          </header>
          <div className="grid-2">
            <section>
              <h6>Posts</h6>
              {posts.loading && <p aria-busy="true">Loading posts...</p>}
              {posts.error && <p>Could not load posts: {posts.error.message}</p>}
              {posts.data?.posts.length === 0 && <p className="muted">No posts.</p>}
              <ul>
                {posts.data?.posts.map((post) => (
                  <li key={post.id}>{post.title}</li>
                ))}
              </ul>
            </section>
            <section>
              <h6>Todos</h6>
              {todos.loading && <p aria-busy="true">Loading todos...</p>}
              {todos.error && <p>Could not load todos: {todos.error.message}</p>}
              {todos.data?.todos.length === 0 && <p className="muted">No todos.</p>}
              <ul>
                {todos.data?.todos.map((todo) => (
                  <li key={todo.id}>
                    {todo.completed ? "✓" : "○"} {todo.todo}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </article>
      )}
    </main>
  );
};
