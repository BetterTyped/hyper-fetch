import { useFetch } from "@hyper-fetch/react";

import { getMessageCountRequest, pageSize } from "./api";
import { ChatHistory } from "./ChatHistory";

export const App = () => {
  // The chat opens at the newest page, so the total decides where to start.
  const { data, error, loading } = useFetch(getMessageCountRequest);

  return (
    <main className="container narrow">
      <hgroup>
        <h1>Chat history</h1>
        <p>The newest messages are at the bottom. Scroll up to load older ones. Your place in the chat stays put.</p>
      </hgroup>
      {loading && !data && <p aria-busy="true">Opening the conversation...</p>}
      {error && <p className="error">Could not open the conversation: {error.message}</p>}
      {data && <ChatHistory startAt={Math.max(data.total - pageSize, 0)} />}
    </main>
  );
};
