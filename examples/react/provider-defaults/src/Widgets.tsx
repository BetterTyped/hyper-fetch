import { useFetch } from "@hyper-fetch/react";
import type { ReactNode } from "react";
import { useState } from "react";

import { getRandomQuoteRequest, getRandomTodoRequest, getUserRequest } from "./api";

type CardProps = {
  title: string;
  rule: string;
  requests: number;
  state: {
    loading: boolean;
    error: { message: string } | null;
    responseTimestamp: Date | null;
  };
  children: ReactNode;
};

const Card = ({ title, rule, requests, state: { loading, error, responseTimestamp }, children }: CardProps) => (
  <article>
    <header className="toolbar">
      <strong>{title}</strong>
      <small aria-busy={loading}>{loading ? "" : `${requests} request(s)`}</small>
    </header>
    <p>
      <mark>{rule}</mark>
    </p>
    {error ? <p className="error">Could not load: {error.message}</p> : children}
    <footer className="muted">
      <small>Updated {responseTimestamp ? responseTimestamp.toLocaleTimeString() : "never"}</small>
    </footer>
  </article>
);

/** Counts the requests a hook really sends, so the effect of the options is visible. */
const useCounter = () => {
  const [count, setCount] = useState(0);
  return [count, () => setCount((value) => value + 1)] as const;
};

export const QuoteWidget = () => {
  const [requests, count] = useCounter();
  // No options: everything comes from the Provider.
  const quote = useFetch(getRandomQuoteRequest);
  quote.onRequestStart(count);
  const { data } = quote;

  return (
    <Card title="Quote" rule="Provider defaults" requests={requests} state={quote}>
      <blockquote>
        {data?.quote ?? "..."}
        <footer>
          <cite>{data?.author}</cite>
        </footer>
      </blockquote>
    </Card>
  );
};

export const TodoWidget = () => {
  const [requests, count] = useCounter();
  // Overrides one option. `refresh` and `refetchOnFocus` still come from the Provider.
  const todo = useFetch(getRandomTodoRequest, { refreshTime: 2000 });
  todo.onRequestStart(count);
  const { data } = todo;

  return (
    <Card title="Todo" rule="Override: refreshTime 2s" requests={requests} state={todo}>
      <p>{data ? `${data.completed ? "Done" : "To do"}: ${data.todo}` : "..."}</p>
    </Card>
  );
};

export const UserWidget = () => {
  const [requests, count] = useCounter();
  // A profile rarely changes, so this hook opts out of the global refreshing.
  const user = useFetch(getUserRequest, {
    refresh: false,
    refetchOnFocus: false,
  });
  user.onRequestStart(count);
  const { data } = user;

  return (
    <Card title="Profile" rule="Override: no refresh" requests={requests} state={user}>
      <p>{data ? `${data.firstName} ${data.lastName}, ${data.email}` : "..."}</p>
    </Card>
  );
};
