import { useFetch, useSubmit } from "@hyper-fetch/react";
import { type FormEvent, useState } from "react";

import { addMessage, deleteMessage, latestMessages, likeMessage, type MessageDoc } from "./api";
import { missingEnv } from "./firebase";

const Setup = () => (
  <article>
    <header>
      <strong>Connect a Firebase project</strong>
    </header>
    <p>This example reads and writes Firestore, so it needs your own project. These variables are missing:</p>
    <ul>
      {missingEnv.map((name) => (
        <li key={name}>
          <code>{name}</code>
        </li>
      ))}
    </ul>
    <p>
      Copy <code>.env.example</code> to <code>.env.local</code>, fill in the web app config from the Firebase console,
      and restart <code>npm run dev</code>. To try it without a project, start the Firestore emulator and set only the
      project id and <code>VITE_FIREBASE_EMULATOR_HOST</code>.
    </p>
  </article>
);

const Guestbook = () => {
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");

  const { data, error, loading, status, refetch } = useFetch(latestMessages);
  const { submit, submitting, error: addError, onSubmitSuccess } = useSubmit(addMessage);

  onSubmitSuccess(() => {
    setText("");
    refetch();
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit({
      payload: {
        author: author || "anonymous",
        text,
        likes: 0,
        createdAt: Date.now(),
      },
    });
  };

  const like = async (message: MessageDoc) => {
    const response = await likeMessage
      .setParams({ messageId: message.__key })
      .send({ payload: { likes: message.likes + 1 } });
    if (response.success) refetch();
  };

  const remove = async (message: MessageDoc) => {
    const response = await deleteMessage.setParams({ messageId: message.__key }).send();
    if (response.success) refetch();
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <fieldset className="grid">
          <input value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="Your name" />
          <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Message" required />
          <button type="submit" aria-busy={submitting} disabled={submitting}>
            Sign
          </button>
        </fieldset>
        {/* Firebase errors, such as permission-denied from security rules, resolve in `error`, never throw. */}
        {addError && <small className="error">{addError.message}</small>}
      </form>
      {loading && !data && <p aria-busy="true">Loading messages...</p>}
      {error && <p className="error">Could not load messages: {error.message}</p>}
      {status === "emptyResource" && <p className="muted">No messages yet. Be the first to sign.</p>}
      <ul className="list">
        {data?.map((message) => (
          <li key={message.__key}>
            <span>
              <strong>{message.author}</strong> {message.text}
              <br />
              <small className="muted">{new Date(message.createdAt).toLocaleString()}</small>
            </span>
            <span role="group">
              <button type="button" className="outline" onClick={() => like(message)}>
                Like {message.likes}
              </button>
              <button type="button" className="outline secondary" onClick={() => remove(message)}>
                Delete
              </button>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
};

export const App = () => (
  <main className="container">
    <hgroup>
      <h1>Firestore guestbook</h1>
      <p>Firestore reads and writes as HyperFetch requests, with useFetch, useSubmit and typed responses.</p>
    </hgroup>
    {missingEnv.length > 0 ? <Setup /> : <Guestbook />}
  </main>
);
