import { type Card, createCard, deleteCard, getCards, updateCard } from "./cards";

/**
 * A fake backend built with HyperFetch mocking. `setMock` replaces the adapter of a request, so the app code is the
 * same as with a real API. The board is kept in localStorage: it survives a reload and every tab sees the same data,
 * like a real database would.
 */
const STORAGE_KEY = "hyper-fetch-kanban";

const seed: Card[] = [
  { id: 1, title: "Write the release notes", status: "todo" },
  { id: 2, title: "Review the pull request", status: "todo" },
  { id: 3, title: "Fix the login redirect", status: "doing" },
  { id: 4, title: "Set up the staging server", status: "done" },
];

const readCards = (): Card[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : seed;
};

const writeCards = (cards: Card[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));

// Slow enough to see the optimistic change before the server answers.
const latency = { responseTime: 700 };

let failing = false;

/** While on, every write answers 500 and HyperFetch rolls the optimistic change back. */
export const setServerFailing = (value: boolean) => {
  failing = value;
};

export const resetServer = () => writeCards(seed);

const serverError = () => ({ error: { message: "The server is down" }, status: 500 });
const notFound = () => ({ error: { message: "This card no longer exists" }, status: 404 });
const badRequest = () => ({ error: { message: "Missing card data" }, status: 400 });

getCards.setMock(() => ({ data: readCards(), status: 200 }), latency);

createCard.setMock(({ request }) => {
  if (failing) return serverError();
  if (!request.payload) return badRequest();
  const cards = readCards();
  const card: Card = { ...request.payload, id: Math.max(0, ...cards.map((item) => item.id)) + 1 };
  writeCards([...cards, card]);
  return { data: card, status: 201 };
}, latency);

updateCard.setMock(({ request }) => {
  if (failing) return serverError();
  const cards = readCards();
  const card = cards.find((item) => item.id === Number(request.params?.cardId));
  if (!card) return notFound();
  const updated = { ...card, ...request.payload };
  writeCards(cards.map((item) => (item.id === card.id ? updated : item)));
  return { data: updated, status: 200 };
}, latency);

deleteCard.setMock(({ request }) => {
  if (failing) return serverError();
  const id = Number(request.params?.cardId);
  writeCards(readCards().filter((item) => item.id !== id));
  return { data: { id }, status: 200 };
}, latency);
