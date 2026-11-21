import { useStream } from "@hyper-fetch/react";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { type ChatMessage, sendChat } from "./api";

type Entry = ChatMessage & { id: number; stopped?: boolean; failed?: boolean };
type Finish = { content: string; stopped?: boolean; failed?: boolean };

/** One streamed answer. It starts on mount and reports the final text once, when it ends or is stopped. */
const StreamingAnswer = ({ history, onFinish }: { history: ChatMessage[]; onFinish: (result: Finish) => void }) => {
  const request = useMemo(() => sendChat.setPayload({ messages: history }), [history]);
  // `text` grows with every chunk. `abort()` cancels the request, or the body when it is already being read.
  const { text, streaming, done, error, abort } = useStream(request, { autoStart: true });

  useEffect(() => {
    if (done) onFinish({ content: text });
    if (error) onFinish({ content: text, failed: true });
    // Runs once per finished stream.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, error]);

  const stop = () => {
    abort();
    onFinish({ content: text, stopped: true });
  };

  return (
    <>
      <p aria-busy={!text}>
        {text}
        {streaming && <span className="cursor" />}
      </p>
      <button type="button" className="outline secondary small" onClick={stop}>
        Stop
      </button>
    </>
  );
};

export const App = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [pending, setPending] = useState<{ id: number; history: ChatMessage[] } | null>(null);
  const nextId = useRef(0);

  const ask = (history: ChatMessage[]) => {
    nextId.current += 1;
    setPending({ id: nextId.current, history });
  };

  const finish = (result: Finish) => {
    if (!pending) return;
    setEntries((prev) => [...prev, { id: pending.id, role: "assistant", ...result }]);
    setPending(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const content = String(new FormData(form).get("prompt")).trim();
    if (!content) return;
    form.reset();
    nextId.current += 1;
    const next = [...entries, { id: nextId.current, role: "user" as const, content }];
    setEntries(next);
    ask(next.map(({ role, content: text }) => ({ role, content: text })));
  };

  const regenerate = () => {
    // Drop the last answer and ask again with the same history.
    const history = entries.slice(0, -1);
    setEntries(history);
    ask(history.map(({ role, content }) => ({ role, content })));
  };

  const last = entries.at(-1);

  return (
    <main className="container">
      <hgroup>
        <h1>AI chat</h1>
        <p>A local server streams a fake model answer word by word. Stop it halfway, or ask for another answer.</p>
      </hgroup>
      <section className="chat">
        {entries.length === 0 && !pending && (
          <p className="muted">Ask anything, or ask about the cache or offline mode.</p>
        )}
        {entries.map((entry) => (
          <article key={entry.id} className={entry.role}>
            <p>{entry.content || <em className="muted">No text.</em>}</p>
            {entry.stopped && <small className="muted">Stopped</small>}
            {entry.failed && <small className="error">The stream failed. Regenerate to try again.</small>}
          </article>
        ))}
        {pending && (
          // A new key for every answer gives each one its own `useStream` state.
          <article key={pending.id} className="assistant">
            <StreamingAnswer history={pending.history} onFinish={finish} />
          </article>
        )}
      </section>
      {last?.role === "assistant" && !pending && (
        <button type="button" className="outline small" onClick={regenerate}>
          Regenerate
        </button>
      )}
      <form onSubmit={handleSubmit} role="group">
        <input name="prompt" placeholder="Message the fake model" autoComplete="off" disabled={!!pending} />
        <button type="submit" disabled={!!pending}>
          Send
        </button>
      </form>
    </main>
  );
};
