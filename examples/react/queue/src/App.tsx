import { useQueue, useSubmit } from "@hyper-fetch/react";
import type { QueueRequest } from "@hyper-fetch/react";
import type { FormEvent } from "react";

import { sendMessageRequest } from "./api";

type Item = QueueRequest<typeof sendMessageRequest>;

let counter = 0;

export const App = () => {
  const { submit } = useSubmit(sendMessageRequest);
  // `keepFinishedRequests` keeps sent messages in the list, so the whole history stays visible.
  const { requests, stopped, start, pause, stop, dispatcher } = useQueue(sendMessageRequest, {
    keepFinishedRequests: true,
  });

  const queueMessage = (title: string) => {
    // Each submit joins the end of the queue. It is sent once every message before it is done.
    submit({ payload: { title, userId: 1 } });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    queueMessage(String(new FormData(form).get("title")));
    form.reset();
  };

  const queueFive = () => {
    Array.from({ length: 5 }).forEach(() => {
      counter += 1;
      queueMessage(`Message ${counter}`);
    });
  };

  const getStatus = (item: Item) => {
    if (item.success) return <mark>Sent</mark>;
    if (item.failed) return <span className="error">Failed</span>;
    if (item.removed) return <span className="muted">Removed</span>;
    if (dispatcher.hasRunningRequest(item.request.queryKey, item.requestId))
      return <span aria-busy="true">Sending</span>;
    // `canceled` is set when Stop aborts the running message. It stays in the queue and is sent again on Start.
    if (item.canceled || item.stopped || stopped) return <span className="muted">On hold</span>;
    return <span className="muted">Waiting</span>;
  };

  const isPending = (item: Item) => !item.success && !item.failed && !item.removed;

  return (
    <main className="container narrow">
      <hgroup>
        <h1>Outbox</h1>
        <p>Messages are sent one at a time, in order. Pause, stop or remove them while they wait.</p>
      </hgroup>

      <form role="group" onSubmit={handleSubmit}>
        <input name="title" placeholder="Write a message" aria-label="Message" required />
        <button type="submit">Queue</button>
        <button type="button" className="secondary" onClick={queueFive}>
          Queue 5
        </button>
      </form>

      <div className="toolbar">
        <strong>Queue {stopped ? "stopped" : "running"}</strong>
        <div className="actions">
          <button type="button" className="outline" onClick={start} disabled={!stopped}>
            Start
          </button>
          {/* Pause lets the message being sent finish. Stop cancels it and keeps it in the queue. */}
          <button type="button" className="outline" onClick={pause} disabled={stopped}>
            Pause
          </button>
          <button type="button" className="outline secondary" onClick={stop} disabled={stopped}>
            Stop
          </button>
        </div>
      </div>

      {requests.length === 0 && <p className="muted">The outbox is empty.</p>}
      <table>
        <tbody>
          {requests.map((item) => (
            <tr key={item.requestId}>
              <td>{item.request.payload?.title}</td>
              <td>{getStatus(item)}</td>
              <td className="right">
                {isPending(item) && (
                  <button type="button" className="outline secondary" onClick={item.deleteRequest}>
                    Remove
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
};
