import { useListener, useSubmit } from "@hyper-fetch/react";
import { type FormEvent, useState } from "react";

import type { Message } from "../server/router";
import { onMessage, sendMessage } from "./api";

const rooms = ["general", "random"] as const;
const author = `guest-${Math.floor(Math.random() * 1000)}`;

const Room = ({ room }: { room: (typeof rooms)[number] }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");

  // The payload is the procedure input. Another room is another subscription.
  const { status, connected, extra, error, onEvent } = useListener(onMessage.setPayload({ room }));
  const { submit, submitting } = useSubmit(sendMessage);

  // `data` is the event without the `tracked()` wrapper, the id is in `extra.eventId`.
  onEvent(({ data }) => {
    setMessages((current) => (current.some((message) => message.id === data.id) ? current : [...current, data]));
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await submit({ payload: { room, author, text } });
    if (response.success) setText("");
  };

  return (
    <article>
      <header className="toolbar">
        <strong>#{room}</strong>
        <small className="muted" aria-busy={status === "starting"}>
          {connected ? "connected" : "offline"} / {status} / last event {extra?.eventId ?? "-"}
        </small>
      </header>
      {status === "failed" && <p className="error">Subscription failed: {error?.message}</p>}
      <ul className="list messages">
        {messages.map((message) => (
          <li key={message.id}>
            <span>
              <strong>{message.author === author ? "you" : message.author}</strong> {message.text}
            </span>
            <small className="muted">#{message.id}</small>
          </li>
        ))}
        {messages.length === 0 && <li className="muted">No messages yet. Say hi.</li>}
      </ul>
      <form onSubmit={handleSubmit}>
        <fieldset role="group">
          <input value={text} onChange={(event) => setText(event.target.value)} placeholder={`Message #${room}`} />
          <button type="submit" aria-busy={submitting} disabled={submitting || !text.trim()}>
            Send
          </button>
        </fieldset>
      </form>
    </article>
  );
};

export const App = () => {
  const [room, setRoom] = useState<(typeof rooms)[number]>("general");

  return (
    <main className="container">
      <hgroup>
        <h1>tRPC subscriptions</h1>
        <p>
          Messages stream from a tRPC subscription over Server-Sent Events. Open a second tab to chat with yourself.
        </p>
      </hgroup>
      <div role="group">
        {rooms.map((name) => (
          <button
            key={name}
            type="button"
            className={name === room ? undefined : "outline"}
            onClick={() => setRoom(name)}
          >
            #{name}
          </button>
        ))}
      </div>
      {/* `key` gives every room a fresh message list. */}
      <Room key={room} room={room} />
    </main>
  );
};
