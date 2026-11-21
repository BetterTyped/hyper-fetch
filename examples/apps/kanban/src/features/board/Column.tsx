import { useSubmit } from "@hyper-fetch/react";
import { type DragEvent, type FormEvent, useState } from "react";

import { type Card, type CardStatus, createCard, updateCard } from "../../api/cards";
import { CardItem } from "./CardItem";

type ColumnProps = { status: CardStatus; title: string; cards: Card[] };

export const Column = ({ status, title, cards }: ColumnProps) => {
  const [over, setOver] = useState(false);
  const move = useSubmit(updateCard);
  const create = useSubmit(createCard);

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setOver(false);
    const cardId = Number(event.dataTransfer.getData("text/plain"));
    if (!cardId || cards.some((card) => card.id === cardId)) return;
    // The card jumps to this column in the same render. A failed save puts it back.
    move.submit({ params: { cardId }, payload: { status } });
  };

  const handleAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const cardTitle = String(new FormData(form).get("title") ?? "").trim();
    if (!cardTitle) return;
    create.submit({ payload: { title: cardTitle, status } });
    form.reset();
  };

  return (
    <section
      className={over ? "column over" : "column"}
      // `preventDefault` on dragover is what allows dropping here.
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
    >
      <h2>
        {title} <small className="muted">{cards.length}</small>
      </h2>
      <ul className="cards">
        {cards.map((card) => (
          <CardItem key={card.id} card={card} />
        ))}
      </ul>
      <form onSubmit={handleAdd}>
        <input name="title" placeholder="Add a card" aria-label={`Add a card to ${title}`} />
      </form>
    </section>
  );
};
