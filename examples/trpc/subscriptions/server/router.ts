import { initTRPC, tracked } from "@trpc/server";
import { z } from "zod";

export const rooms = ["general", "random"] as const;
export type Message = {
  id: string;
  room: string;
  author: string;
  text: string;
  sentAt: string;
};

// In memory, so the history resets when the dev server restarts.
const history: Message[] = [];
const subscribers = new Set<(message: Message) => void>();
let nextId = 1;

const publish = (message: Omit<Message, "id" | "sentAt">) => {
  const saved: Message = {
    ...message,
    id: String(nextId++),
    sentAt: new Date().toISOString(),
  };
  history.push(saved);
  subscribers.forEach((notify) => notify(saved));
};

/** Subscribes right away and yields every published message until tRPC aborts the signal. */
const subscribe = (signal: AbortSignal | undefined) => {
  const queue: Message[] = [];
  let wake = () => {};
  const notify = (message: Message) => {
    queue.push(message);
    wake();
  };
  subscribers.add(notify);
  signal?.addEventListener("abort", () => {
    subscribers.delete(notify);
    wake();
  });

  return (async function* () {
    while (!signal?.aborted) {
      const message = queue.shift();
      if (message) yield message;
      else await new Promise<void>((resolve) => (wake = resolve));
    }
  })();
};

const t = initTRPC.create();

export const appRouter = t.router({
  chat: t.router({
    post: t.procedure
      .input(
        z.object({
          room: z.enum(rooms),
          author: z.string().min(1),
          text: z.string().trim().min(1),
        }),
      )
      .mutation(({ input }) => {
        publish(input);
        // A reply from the server shows that events arrive without the client asking for them.
        setTimeout(
          () =>
            publish({
              room: input.room,
              author: "bot",
              text: `Got "${input.text}"`,
            }),
          1000,
        );
        return { ok: true };
      }),
    onMessage: t.procedure
      // The adapter sends `lastEventId` back when it restarts the subscription after a reconnect.
      .input(z.object({ room: z.enum(rooms), lastEventId: z.string().nullish() }))
      .subscription(async function* ({ input, signal }) {
        // Start listening before reading the history, so no message falls in between.
        const live = subscribe(signal);
        const after = Number(input.lastEventId ?? 0);
        const missed = history.filter((message) => message.room === input.room && Number(message.id) > after);
        // A fresh subscription gets the last 5 messages, a resumed one everything it missed.
        for (const message of input.lastEventId ? missed : missed.slice(-5)) {
          yield tracked(message.id, message);
        }
        for await (const message of live) {
          if (message.room === input.room) yield tracked(message.id, message);
        }
      }),
  }),
});

/** The client imports only this type, never the server code. */
export type AppRouter = typeof appRouter;
