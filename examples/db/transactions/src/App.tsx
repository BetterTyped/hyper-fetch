import type { Transaction } from "@hyper-fetch/db";
import { useLiveQuery } from "@hyper-fetch/react";
import { useState, useSyncExternalStore } from "react";

import { type Card, type Column, columns, db } from "./db";
import { getServerLog, setServerFailing, subscribeToServerLog } from "./server";

const labels: Record<Column, string> = { todo: "To do", doing: "Doing", done: "Done" };

/** A named transaction: the card update and the activity row go out in one request, and revert together. */
const moveCard = (card: Card, column: Column, cards: Card[]) => {
  const position = Math.max(0, ...cards.filter((item) => item.column === column).map((item) => item.position)) + 1;
  return db.transaction("move", (tx) => {
    tx.card.update(card.id, { column, position });
    tx.activity.insert({
      id: crypto.randomUUID(),
      text: `"${card.title}" moved to ${labels[column]}`,
      createdAt: Date.now(),
    });
  });
};

/**
 * An unnamed transaction: each write goes through its collection's own `mutate`, one after another. When one fails, it
 * reverts, the writes after it are dropped without being sent, and the writes before it stay.
 */
const clearDone = (cards: Card[]) => {
  const done = cards.filter((card) => card.column === "done");
  return db.transaction((tx) => {
    done.forEach((card) => tx.card.delete(card.id));
    tx.activity.insert({
      id: crypto.randomUUID(),
      text: `Cleared ${done.length} done cards`,
      createdAt: Date.now(),
    });
  });
};

export const App = () => {
  const [fail, setFail] = useState(false);
  const [pending, setPending] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const serverLog = useSyncExternalStore(subscribeToServerLog, getServerLog);

  const { data: cards, status } = useLiveQuery(db.card.orderBy((card) => card.position, "asc"));
  const { data: activity } = useLiveQuery(db.activity.orderBy((item) => item.createdAt, "desc").limit(4));

  // A transaction resolves with the result and never throws. On failure the db has already reverted its writes.
  const run = async (label: string, transaction: Transaction) => {
    setPending(true);
    const { success, error } = await transaction;
    setPending(false);
    const reason = error instanceof Error ? error.message : String(error);
    const line = success ? `${label}: saved` : `${label}: failed, ${reason}`;
    setResults((lines) => [`${new Date().toLocaleTimeString()} ${line}`, ...lines].slice(0, 4));
  };

  const handleFailChange = (checked: boolean) => {
    setFail(checked);
    setServerFailing(checked);
  };

  const board = cards ?? [];
  const lastBody = serverLog.find((entry) => entry.body !== undefined);

  return (
    <main className="container">
      <hgroup>
        <h1>Board</h1>
        <p>Moving a card also logs an activity. Both show at once, and the server keeps or rejects them together.</p>
      </hgroup>

      <label>
        <input
          type="checkbox"
          role="switch"
          checked={fail}
          onChange={(event) => handleFailChange(event.target.checked)}
        />
        Make the server reject every write
      </label>

      {status === "loading" && <p aria-busy="true">Loading the board...</p>}

      <div className="board">
        {columns.map((column, index) => (
          <section key={column}>
            <h2>{labels[column]}</h2>
            {board
              .filter((card) => card.column === column)
              .map((card) => (
                <article key={card.id} className="card">
                  <span>{card.title}</span>
                  <div role="group">
                    <button
                      className="outline"
                      aria-label={`Move ${card.title} left`}
                      disabled={pending || index === 0}
                      onClick={() => run(`Move "${card.title}"`, moveCard(card, columns[index - 1], board))}
                    >
                      ←
                    </button>
                    <button
                      className="outline"
                      aria-label={`Move ${card.title} right`}
                      disabled={pending || index === columns.length - 1}
                      onClick={() => run(`Move "${card.title}"`, moveCard(card, columns[index + 1], board))}
                    >
                      →
                    </button>
                  </div>
                </article>
              ))}
            {column === "done" && (
              <button
                className="secondary"
                disabled={pending || !board.some((card) => card.column === "done")}
                onClick={() => run("Clear done", clearDone(board))}
              >
                Clear done
              </button>
            )}
          </section>
        ))}
      </div>

      <div className="grid">
        <article>
          <header>Activity</header>
          {activity?.length === 0 && <small className="muted">Move a card.</small>}
          <ul className="log">
            {activity?.map((item) => (
              <li key={item.id}>{item.text}</li>
            ))}
          </ul>
        </article>
        <article>
          <header>Results</header>
          {results.length === 0 && <small className="muted">Each transaction resolves with its result.</small>}
          <ul className="log">
            {results.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </article>
      </div>

      <article>
        <header>Requests the server received</header>
        {serverLog.length === 0 && <small className="muted">Move a card or clear the Done column.</small>}
        <ul className="log">
          {serverLog.map((entry) => (
            <li key={entry.id}>
              {entry.time} {entry.line}
            </li>
          ))}
        </ul>
        {lastBody && (
          <>
            <small className="muted">Last payload</small>
            <pre>{JSON.stringify(lastBody.body, null, 2)}</pre>
          </>
        )}
      </article>
    </main>
  );
};
