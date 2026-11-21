import { optimistic } from "@hyper-fetch/core";

import { client } from "./client";

export type CardStatus = "todo" | "doing" | "done";
export type Card = { id: number; title: string; status: CardStatus };
export type NewCard = Omit<Card, "id">;
export type CardChanges = Partial<NewCard>;

/** The board on screen. Every optimistic change below targets this request, so it edits the same cache entry. */
export const getCards = client.createRequest<{ response: Card[] }>()({ endpoint: "/cards" });

/** For the rollbacks: puts the card from `previous` back at its old index, and keeps every other change. */
const restore = (data: Card[], previous: Card[], cardId: number) => {
  const index = previous.findIndex((card) => card.id === cardId);
  const before = previous[index];
  if (!before) return data;
  const rest = data.filter((card) => card.id !== cardId);
  return [...rest.slice(0, index), before, ...rest.slice(index)];
};

export const createCard = client
  .createRequest<{ response: Card; payload: NewCard }>()({
    endpoint: "/cards",
    method: "POST",
    // Mutations change the board entry, they need no cache entry of their own.
    cache: false,
  })
  .setOptimistic(({ payload }) => {
    // A temporary negative id marks the card as "not saved yet".
    const temp: Card = { ...payload, id: -Date.now() };

    return [
      optimistic(getCards)
        .insert(temp)
        // Swap the temporary card for the saved one, so it can be edited before the board is refetched.
        .commit(({ data, response }) => data.map((card) => (card.id === temp.id ? response.data : card)))
        .rollback(({ data }) => data.filter((card) => card.id !== temp.id)),
    ];
  });

export const updateCard = client
  .createRequest<{ response: Card; payload: CardChanges }>()({
    endpoint: "/cards/:cardId",
    method: "PATCH",
    cache: false,
    // Two quick moves of one card are sent in order, so the server never ends up with the older one.
    queued: true,
  })
  .setOptimistic(({ params, payload }) => [
    optimistic(getCards)
      .patch(params.cardId, payload)
      .rollback(({ data, previous }) => restore(data, previous, Number(params.cardId))),
  ]);

export const deleteCard = client
  .createRequest<{ response: { id: number } }>()({
    endpoint: "/cards/:cardId",
    method: "DELETE",
    cache: false,
  })
  .setOptimistic(({ params }) => [
    optimistic(getCards)
      .remove(params.cardId)
      .rollback(({ data, previous }) => restore(data, previous, Number(params.cardId))),
  ]);
