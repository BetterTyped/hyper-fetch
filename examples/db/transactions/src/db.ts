import { createClient } from "@hyper-fetch/core";
import { collection, createDb, type TransactionWrite } from "@hyper-fetch/db";
import { z } from "zod";

/** The base URL is never reached: `server.ts` answers every request with `setMock`. */
export const client = createClient({ url: "https://api.example.com" });

export const columns = ["todo", "doing", "done"] as const;
export type Column = (typeof columns)[number];

export const CardSchema = z.object({
  id: z.string(),
  title: z.string(),
  column: z.enum(columns),
  position: z.number(),
});
export type Card = z.infer<typeof CardSchema>;

export const ActivitySchema = z.object({
  id: z.string(),
  text: z.string(),
  createdAt: z.number(),
});
export type Activity = z.infer<typeof ActivitySchema>;

export const getCards = client.createRequest<{ response: Card[] }>()({ endpoint: "/cards" });

export const deleteCard = client.createRequest<{ response: { id: string } }>()({
  endpoint: "/cards/:cardId",
  method: "DELETE",
});

export const getActivity = client.createRequest<{ response: Activity[] }>()({ endpoint: "/activity" });

export const createActivity = client.createRequest<{ response: Activity; payload: Activity }>()({
  endpoint: "/activity",
  method: "POST",
});

/** One endpoint that applies a list of writes in one database transaction on the server */
export const applyWrites = client.createRequest<{
  response: { applied: number };
  payload: { idempotencyKey: string; mutations: TransactionWrite[] };
}>()({ endpoint: "/board/transactions", method: "POST" });

/**
 * The collections declare only the writes the unnamed transaction sends one by one. The named transaction below
 * builds its own request, so it can also update cards, which declare no `update`.
 */
const Card = collection(CardSchema, { key: "id" })
  .load(getCards)
  .mutate({
    delete: { request: deleteCard, map: (key) => ({ params: { cardId: key } }) },
  });

const Activity = collection(ActivitySchema, { key: "id" })
  .load(getActivity)
  .mutate({
    insert: { request: createActivity, map: (row) => ({ payload: row }) },
  });

/**
 * `move` is a named transaction: `db.transaction("move", ...)` sends all of its writes in one request. The transaction
 * id is sent as an idempotency key, so a request sent twice is applied once.
 */
export const db = createDb(
  { card: Card, activity: Activity },
  {
    transactions: {
      move: {
        mutationFn: ({ id, mutations }) => applyWrites.setPayload({ idempotencyKey: id, mutations }),
      },
    },
  },
);
