import { useFetch } from "@hyper-fetch/react";
import { useState } from "react";

import { getPostCommentsRequest, getRandomQuoteRequest } from "./api";
import type { Quote } from "./api";
import { RequestLog } from "./RequestLog";

/** Lazy hook: `useFetch` is mounted from the start, but `disabled` holds the request until the button is clicked. */
const Comments = () => {
  const [requested, setRequested] = useState(false);
  const { data, error, loading, refetch } = useFetch(getPostCommentsRequest, { disabled: !requested });

  return (
    <article>
      <header className="toolbar">
        <strong>useFetch with disabled</strong>
        {requested ? (
          <button type="button" className="outline" onClick={refetch} disabled={loading}>
            Refresh
          </button>
        ) : (
          <button type="button" onClick={() => setRequested(true)}>
            Show comments
          </button>
        )}
      </header>
      {!requested && <p className="muted">Comments are loaded when you ask for them.</p>}
      {loading && !data && <p aria-busy="true">Loading comments...</p>}
      {error && <p className="error">Could not load comments: {error.message}</p>}
      {data?.comments.map((comment) => (
        <p key={comment.id}>
          <strong>@{comment.user.username}</strong> {comment.body}
        </p>
      ))}
    </article>
  );
};

/** Imperative call: `send()` resolves with the response, and the component keeps the result in its own state. */
const QuoteButton = () => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    // `send()` never throws for a failed request. The response tells you what happened.
    const response = await getRandomQuoteRequest.send();
    setLoading(false);
    if (response.data) setQuote(response.data);
    setError(response.error ? response.error.message : null);
  };

  return (
    <article>
      <header className="toolbar">
        <strong>request.send()</strong>
        <button type="button" onClick={handleClick} aria-busy={loading} disabled={loading}>
          Get a quote
        </button>
      </header>
      {error && <p className="error">Could not load a quote: {error}</p>}
      {quote ? (
        <blockquote>
          {quote.quote}
          <footer>
            <cite>{quote.author}</cite>
          </footer>
        </blockquote>
      ) : (
        <p className="muted">Each click sends a new request.</p>
      )}
    </article>
  );
};

export const App = () => (
  <main className="container">
    <hgroup>
      <h1>Fetch on click</h1>
      <p>Two ways to wait for the user before sending a request.</p>
    </hgroup>
    <div className="grid-2">
      <Comments />
      <QuoteButton />
    </div>
    <RequestLog />
  </main>
);
