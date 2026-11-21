import { useInfiniteFetch } from "@hyper-fetch/react";
import { useLayoutEffect, useRef } from "react";

import { getMessagesRequest, messagesPagination, pageSize } from "./api";

/** Starts at the newest page (`startAt`) and walks back to older pages with `fetchPreviousPage`. */
export const ChatHistory = ({ startAt }: { startAt: number }) => {
  const list = useInfiniteFetch(
    getMessagesRequest.setQueryParams({ limit: pageSize, skip: startAt, select: "body,user" }),
    {
      pagination: messagesPagination,
      // Pages overlap when the total is not a multiple of the page size. `uniqueBy` drops the repeated messages.
      uniqueBy: "id",
    },
  );
  const { items, pageParams, total, loading, error, hasPreviousPage, isFetchingPreviousPage } = list;
  const { isFetchPreviousPageError, fetchPreviousPage } = list;

  const scroller = useRef<HTMLDivElement>(null);
  const fromBottom = useRef(0);
  const firstParam = pageParams[0];

  // Runs after older messages are added above, before the browser paints: keep the same distance from the bottom,
  // so the message you were reading stays in place. On the first page that distance is 0: start at the newest.
  useLayoutEffect(() => {
    const element = scroller.current;
    if (element) element.scrollTop = element.scrollHeight - element.clientHeight - fromBottom.current;
  }, [firstParam, items.length]);

  const handleScroll = () => {
    const element = scroller.current;
    if (!element) return;
    fromBottom.current = element.scrollHeight - element.clientHeight - element.scrollTop;

    const nearTop = element.scrollTop < 120;
    if (nearTop && hasPreviousPage && !isFetchingPreviousPage && !isFetchPreviousPageError) fetchPreviousPage();
  };

  if (loading) return <article aria-busy="true">Loading messages...</article>;
  if (error && items.length === 0) return <article className="error">Could not load messages: {error.message}</article>;

  return (
    <article>
      <header className="toolbar">
        <strong>#general</strong>
        <small className="muted">
          {items.length} of {total ?? "?"} messages loaded
        </small>
      </header>
      <div ref={scroller} className="chat" onScroll={handleScroll}>
        <p className="muted center">
          {isFetchingPreviousPage && <span aria-busy="true">Loading older messages...</span>}
          {!hasPreviousPage && "This is the start of the conversation."}
          {isFetchPreviousPageError && (
            <button type="button" className="outline" onClick={() => fetchPreviousPage()}>
              Could not load older messages. Try again
            </button>
          )}
        </p>
        {items.map((message) => (
          <div key={message.id} className="message">
            <span className="avatar" aria-hidden="true">
              {message.user.fullName.charAt(0)}
            </span>
            <div>
              <strong>{message.user.fullName}</strong> <small className="muted">#{message.id}</small>
              <p>{message.body}</p>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
};
