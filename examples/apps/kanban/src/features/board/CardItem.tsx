import { useSubmit } from "@hyper-fetch/react";
import { type FormEvent, useState } from "react";

import { type Card, deleteCard, updateCard } from "../../api/cards";

export const CardItem = ({ card }: { card: Card }) => {
  const [editing, setEditing] = useState(false);
  // No state of their own to update: the optimistic changes on the requests edit the board in the cache.
  const update = useSubmit(updateCard);
  const remove = useSubmit(deleteCard);
  // A negative id is a card the server has not saved yet. It cannot be changed until it has a real id.
  const saving = card.id < 0;

  const handleRename = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = String(new FormData(event.currentTarget).get("title") ?? "").trim();
    setEditing(false);
    if (title && title !== card.title) update.submit({ params: { cardId: card.id }, payload: { title } });
  };

  if (editing) {
    return (
      <li className="card">
        <form onSubmit={handleRename}>
          <input name="title" defaultValue={card.title} aria-label="Card title" autoFocus />
          <div role="group">
            <button type="submit">Save</button>
            <button type="button" className="secondary outline" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li
      className="card"
      // Native drag and drop: the card id travels in `dataTransfer` to the column it is dropped on.
      draggable={!saving}
      onDragStart={(event) => event.dataTransfer.setData("text/plain", String(card.id))}
      aria-busy={saving}
    >
      <span>{card.title}</span>
      <div className="card-actions">
        <button type="button" className="secondary outline" disabled={saving} onClick={() => setEditing(true)}>
          Edit
        </button>
        <button
          type="button"
          className="secondary outline"
          disabled={saving}
          onClick={() => remove.submit({ params: { cardId: card.id } })}
        >
          Delete
        </button>
      </div>
    </li>
  );
};
