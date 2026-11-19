import type { AnyTRPCRouter } from "@trpc/server";
import { initTRPC, tracked, TRPCError } from "@trpc/server";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { EventEmitter, on } from "node:events";
import type { AddressInfo } from "node:net";
import superjson from "superjson";
import { WebSocketServer } from "ws";

export type Message = { room: string; text: string };

type Context = { connectionParams: Record<string, string | undefined> | null };

/** One call of a subscription procedure on the server, from the start of the generator to its `finally` */
export type ServerSubscription = { path: string; input: unknown; finished: boolean };

/**
 * What the server knows about its subscriptions - tests read it to prove that a subscription was started once,
 * resumed from the right event and cleaned up after the client left.
 */
export const createServerState = () => {
  const hub = new EventEmitter();
  hub.setMaxListeners(100);
  const subscriptions: ServerSubscription[] = [];
  const contexts: Context[] = [];

  const track = (path: string, input?: unknown) => {
    const subscription: ServerSubscription = { path, input, finished: false };
    subscriptions.push(subscription);
    return subscription;
  };

  /** Subscriptions whose generator is running */
  const active = (path?: string) =>
    subscriptions.filter((subscription) => !subscription.finished && (!path || subscription.path === path));

  /** Delivers a message to the `onMessage` subscriptions of the room */
  const publish = (message: Message & { id: string }) => {
    hub.emit(message.room, message);
  };

  return { hub, subscriptions, contexts, track, active, publish };
};

export type ServerState = ReturnType<typeof createServerState>;

const parseRoom = (value: unknown): { room: string; lastEventId?: string } => {
  const { room, lastEventId } = (value ?? {}) as { room?: unknown; lastEventId?: string };
  if (typeof room !== "string") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Room has to be a string" });
  }
  return { room, lastEventId };
};

export const createSubscriptionsRouter = (state: ServerState) => {
  const t = initTRPC.context<Context>().create();

  return t.router({
    health: t.procedure.query(() => "ok" as const),
    chat: t.router({
      send: t.procedure.input((value) => value as Message).mutation(({ input }) => input),
      /** Tracked messages of a room - resumes after `lastEventId` with the messages it missed */
      onMessage: t.procedure.input(parseRoom).subscription(async function* onMessage({ input, signal, ctx }) {
        state.contexts.push(ctx);
        const subscription = state.track("chat.onMessage", input);
        try {
          if (input.lastEventId) {
            yield tracked(`${input.lastEventId}-resumed`, { room: input.room, text: `after ${input.lastEventId}` });
          }
          for await (const [message] of on(state.hub, input.room, { signal })) {
            const { id, ...data } = message as Message & { id: string };
            yield tracked(id, data);
          }
        } finally {
          subscription.finished = true;
        }
      }),
      /** Plain (not tracked) messages, with an optional room */
      onAny: t.procedure
        .input((value) => value as { room?: string } | undefined)
        .subscription(async function* onAny({ input, signal }) {
          const subscription = state.track("chat.onAny", input);
          try {
            for await (const [message] of on(state.hub, input?.room ?? "general", { signal })) {
              yield message as Message;
            }
          } finally {
            subscription.finished = true;
          }
        }),
    }),
    /** Finite subscription - yields the numbers and returns */
    onCount: t.procedure
      .input((value) => value as { to: number })
      .subscription(async function* onCount({ input }) {
        const subscription = state.track("onCount", input);
        try {
          for (let index = 1; index <= input.to; index += 1) {
            yield index;
          }
        } finally {
          subscription.finished = true;
        }
      }),
    /** No input, waits until the client leaves */
    onIdle: t.procedure.subscription(async function* onIdle({ signal }) {
      const subscription = state.track("onIdle");
      try {
        yield "ready" as const;
        await new Promise((resolve) => {
          signal?.addEventListener("abort", resolve);
        });
      } finally {
        subscription.finished = true;
      }
    }),
    /** Fails after the first event */
    onFail: t.procedure
      .input((value) => value as { code: TRPCError["code"] })
      .subscription(async function* onFail({ input }) {
        const subscription = state.track("onFail", input);
        try {
          yield "before" as const;
          throw new TRPCError({ code: input.code, message: `Failed with ${input.code}` });
        } finally {
          subscription.finished = true;
        }
      }),
  });
};

export const createSubscriptionsTransformerRouter = (state: ServerState) => {
  const t = initTRPC.context<Context>().create({ transformer: superjson });

  return t.router({
    onDate: t.procedure
      .input((value) => value as { since: Date })
      .subscription(async function* onDate({ input, signal }) {
        const subscription = state.track("onDate", input);
        try {
          yield tracked("1", { at: new Date(input.since.getTime() + 1000), tags: new Set(["a"]) });
          await new Promise((resolve) => {
            signal?.addEventListener("abort", resolve);
          });
        } finally {
          subscription.finished = true;
        }
      }),
  });
};

export type SubscriptionsRouter = ReturnType<typeof createSubscriptionsRouter>;
export type SubscriptionsTransformerRouter = ReturnType<typeof createSubscriptionsTransformerRouter>;

const createContext = ({ info }: { info: Context }): Context => {
  return { connectionParams: info.connectionParams };
};

/**
 * Real tRPC WebSocket server (`applyWSSHandler`) on a random local port.
 */
export const createE2EWebsocketServer = (router: AnyTRPCRouter) => {
  let wss: WebSocketServer | undefined;
  let handler: ReturnType<typeof applyWSSHandler> | undefined;

  const startServer = () => {
    return new Promise<string>((resolve, reject) => {
      const server = new WebSocketServer({ port: 0, host: "127.0.0.1" });
      wss = server;
      server.once("error", reject);
      server.once("listening", () => {
        handler = applyWSSHandler({ wss: server, router, createContext });
        const { port } = server.address() as AddressInfo;
        resolve(`ws://127.0.0.1:${port}`);
      });
    });
  };

  /** Connections the server holds right now */
  const clients = () => [...(wss?.clients ?? [])];

  /** Drops every connection without the closing handshake - like a network failure */
  const dropConnections = () => {
    clients().forEach((client) => client.terminate());
  };

  const broadcastReconnect = () => {
    handler?.broadcastReconnectNotification();
  };

  const stopServer = () => {
    return new Promise<void>((resolve, reject) => {
      dropConnections();
      wss?.close((error) => (error ? reject(error) : resolve()));
    });
  };

  return { startServer, stopServer, clients, dropConnections, broadcastReconnect };
};

/**
 * Real tRPC HTTP server (`createHTTPServer`) on a random local port, serving subscriptions as Server-Sent Events.
 */
export const createE2ESseServer = (router: AnyTRPCRouter) => {
  const urls: string[] = [];
  const server = createHTTPServer({
    router,
    createContext: (options) => {
      urls.push(options.req.url ?? "");
      return createContext(options);
    },
  });

  const startServer = () => {
    return new Promise<string>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", () => {
        const { port } = server.address() as AddressInfo;
        resolve(`http://127.0.0.1:${port}`);
      });
    });
  };

  const stopServer = () => {
    return new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
      server.closeAllConnections();
    });
  };

  return { startServer, stopServer, urls };
};
