import { EventPublisher, ORPCError, os, withEventMeta } from "@orpc/server";
import { RPCHandler as NodeRPCHandler } from "@orpc/server/node";
import { RPCHandler as WsRPCHandler } from "@orpc/server/ws";
import { createServer } from "http";
import type { AddressInfo } from "net";
import type { WebSocket as ServerWebSocket } from "ws";
import { WebSocketServer } from "ws";
import { z } from "zod";

export type Planet = { id: number; name: string };

type Context = { authorization?: string };

/** One run of an event iterator procedure on the server */
export type IteratorRun = {
  topic: string;
  input: unknown;
  lastEventId: string | undefined;
  /** `true` once the `finally` block of the generator ran */
  finished: boolean;
};

/**
 * What the server knows about the subscriptions - which generators run, with which input and last event id,
 * and whether they finished. Tests publish planet updates through it.
 */
export const createRealtimeState = () => {
  const publisher = new EventPublisher<Record<string, Planet>>();
  const runs: IteratorRun[] = [];

  return {
    runs,
    /** Generators that did not finish yet */
    active: () => runs.filter((run) => !run.finished),
    publish: (planet: Planet) => publisher.publish(`planet/${planet.id}`, planet),
    start: (run: Omit<IteratorRun, "finished">): IteratorRun => {
      const entry = { ...run, finished: false };
      runs.push(entry);
      return entry;
    },
    subscribe: (id: number, signal: AbortSignal | undefined) => publisher.subscribe(`planet/${id}`, { signal }),
  };
};

export type RealtimeState = ReturnType<typeof createRealtimeState>;

export const createRealtimeRouter = (state: RealtimeState) => {
  const base = os.$context<Context>();

  const authed = base.middleware(({ context, next }) => {
    if (context.authorization !== "Bearer token") {
      throw new ORPCError("UNAUTHORIZED", { message: "Missing token" });
    }
    return next();
  });

  return {
    planet: {
      find: base.input(z.object({ id: z.number() })).handler(({ input }): Planet => ({ id: input.id, name: "Earth" })),
      /** Every update of the planet, the event ids continue from `lastEventId` after a reconnect */
      onUpdate: base.input(z.object({ id: z.number() })).handler(async function* onUpdate({
        input,
        lastEventId,
        signal,
      }) {
        const run = state.start({ topic: "planet/onUpdate", input, lastEventId });
        let index = Number(lastEventId ?? 0);
        try {
          for await (const planet of state.subscribe(input.id, signal)) {
            index += 1;
            yield withEventMeta(planet, { id: String(index) });
          }
        } finally {
          run.finished = true;
        }
      }),
    },
    /** A finite iterator with a return value */
    countdown: base.input(z.object({ from: z.number() })).handler(async function* countdown({ input, lastEventId }) {
      const run = state.start({ topic: "countdown", input, lastEventId });
      try {
        for (let value = input.from; value > 0; value -= 1) {
          yield withEventMeta({ value }, { id: String(value) });
        }
        return "liftoff" as const;
      } finally {
        run.finished = true;
      }
    }),
    /** Fails with a defined error after the first event */
    overheat: base
      .errors({ OVERHEATED: { message: "Too hot", data: z.object({ celsius: z.number() }) } })
      .handler(async function* overheat({ errors }) {
        yield withEventMeta({ celsius: 100 }, { id: "1" });
        throw errors.OVERHEATED({ data: { celsius: 900 } });
      }),
    secret: base.use(authed).handler(async function* secret() {
      yield "classified" as const;
    }),
    types: base.input(z.object({ since: z.date() })).handler(async function* types({ input }) {
      yield { since: input.since, total: 10n, scores: new Map([["a", 1]]), tags: new Set(["x"]) };
    }),
  };
};

export type RealtimeRouter = ReturnType<typeof createRealtimeRouter>;

/** Real oRPC server with the `RPCHandler` of `@orpc/server/node`, answering with event streams */
export const createRealtimeHttpServer = (state: RealtimeState) => {
  const handler = new NodeRPCHandler<Context>(createRealtimeRouter(state));

  const server = createServer(async (req, res) => {
    const { matched } = await handler.handle(req, res, {
      prefix: "/rpc",
      context: { authorization: req.headers.authorization },
    });
    if (!matched) {
      res.statusCode = 404;
      res.end("No procedure matched");
    }
  });

  const start = () =>
    new Promise<string>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", () => {
        const { port } = server.address() as AddressInfo;
        resolve(`http://127.0.0.1:${port}/rpc`);
      });
    });

  const stop = () =>
    new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
      server.closeAllConnections();
    });

  /** Drops every open connection, like a server restart */
  const dropConnections = () => server.closeAllConnections();

  return { start, stop, dropConnections };
};

/** Real oRPC server with the `RPCHandler` of `@orpc/server/ws` on a `ws` server */
export const createRealtimeWsServer = (state: RealtimeState) => {
  const handler = new WsRPCHandler<Context>(createRealtimeRouter(state));
  const wss = new WebSocketServer({ port: 0, host: "127.0.0.1" });
  const connections = new Set<ServerWebSocket>();

  wss.on("connection", (ws, request) => {
    connections.add(ws);
    ws.on("close", () => connections.delete(ws));
    // Browsers can't set headers of the upgrade request, so the token comes in the query string
    const token = new URL(request.url ?? "/", "http://localhost").searchParams.get("token");
    handler.upgrade(ws, { context: { authorization: token ?? undefined } });
  });

  const start = () =>
    new Promise<string>((resolve) => {
      if (wss.address()) {
        const { port } = wss.address() as AddressInfo;
        resolve(`ws://127.0.0.1:${port}`);
        return;
      }
      wss.once("listening", () => {
        const { port } = wss.address() as AddressInfo;
        resolve(`ws://127.0.0.1:${port}`);
      });
    });

  const stop = () =>
    new Promise<void>((resolve, reject) => {
      connections.forEach((ws) => ws.terminate());
      wss.close((error) => (error ? reject(error) : resolve()));
    });

  /** Drops every open connection without the closing handshake, like a lost network */
  const dropConnections = () => connections.forEach((ws) => ws.terminate());

  return { start, stop, dropConnections, connections };
};
