import { useFetch, useIsFetching } from "@hyper-fetch/react";
import type { ReactNode } from "react";

import { client, getPosts, getTodos, getUsers } from "./api";

type CardProps = {
  title: string;
  total?: number;
  loading: boolean;
  error: Error | null;
  onRefresh: () => void;
  children: ReactNode;
};

/** Every card renders its own loading and error state, so a slow request never blocks the others. */
const Card = ({ title, total, loading, error, onRefresh, children }: CardProps) => (
  <article aria-busy={loading && total === undefined}>
    <header className="toolbar">
      <strong>{title}</strong>
      <button type="button" className="outline secondary" onClick={onRefresh} disabled={loading}>
        {loading ? "Loading..." : "Refresh"}
      </button>
    </header>
    {error && (
      <p>
        Could not load {title.toLowerCase()}: {error.message}
      </p>
    )}
    {total !== undefined && (
      <>
        <p className="total">{total}</p>
        <ul>{children}</ul>
      </>
    )}
  </article>
);

/** `useIsFetching` counts the requests running in the client's fetch dispatcher right now. */
const GlobalIndicator = () => {
  const running = useIsFetching(client);

  return (
    <p className="muted" aria-live="polite">
      {running > 0 ? (
        <span aria-busy="true">
          {running} {running === 1 ? "request" : "requests"} in flight
        </span>
      ) : (
        "All requests settled"
      )}
    </p>
  );
};

export const App = () => {
  // Three hooks in one component: all three requests start on mount at the same time, not one after another.
  const users = useFetch(
    getUsers.setQueryParams({
      limit: 3,
      select: "firstName,lastName",
      delay: 600,
    }),
  );
  const posts = useFetch(getPosts.setQueryParams({ limit: 3, select: "title", delay: 1400 }));
  const todos = useFetch(
    getTodos.setQueryParams({
      limit: 3,
      select: "todo,completed",
      delay: 2200,
    }),
  );

  const refreshAll = () => {
    users.refetch();
    posts.refetch();
    todos.refetch();
  };

  return (
    <main className="container">
      <hgroup>
        <h1>Dashboard</h1>
        <p>Three independent requests. Each card shows up as soon as its own response arrives.</p>
      </hgroup>
      <div className="toolbar">
        <GlobalIndicator />
        <button type="button" onClick={refreshAll}>
          Refresh all
        </button>
      </div>
      <div className="grid-3">
        <Card
          title="Users"
          total={users.data?.total}
          loading={users.loading}
          error={users.error}
          onRefresh={users.refetch}
        >
          {users.data?.users.map((user) => (
            <li key={user.id}>
              {user.firstName} {user.lastName}
            </li>
          ))}
        </Card>
        <Card
          title="Posts"
          total={posts.data?.total}
          loading={posts.loading}
          error={posts.error}
          onRefresh={posts.refetch}
        >
          {posts.data?.posts.map((post) => (
            <li key={post.id}>{post.title}</li>
          ))}
        </Card>
        <Card
          title="Todos"
          total={todos.data?.total}
          loading={todos.loading}
          error={todos.error}
          onRefresh={todos.refetch}
        >
          {todos.data?.todos.map((todo) => (
            <li key={todo.id}>{todo.completed ? <s>{todo.todo}</s> : todo.todo}</li>
          ))}
        </Card>
      </div>
    </main>
  );
};
