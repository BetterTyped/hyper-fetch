import type { AnyRouter } from "@orpc/server";
import { ORPCError, os } from "@orpc/server";
import { RPCHandler } from "@orpc/server/node";
import { createServer } from "http";
import type { AddressInfo } from "net";
import { z } from "zod";

export type User = { id: number; name: string };

export type RecordedRequest = { method?: string; url?: string; contentType?: string };

type Context = { authorization?: string };

const users: User[] = [
  { id: 1, name: "John" },
  { id: 2, name: "Jane" },
];

/**
 * Lets a test hold a procedure open for as long as it needs, without relying on timers.
 */
export const createGate = () => {
  let markStarted = () => {};
  let release = () => {};

  const started = new Promise<void>((resolve) => {
    markStarted = resolve;
  });
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });

  return { started, released, markStarted, release };
};

export type Gate = ReturnType<typeof createGate>;

const DAY = 24 * 60 * 60 * 1000;

export const createAppRouter = (getGate: () => Gate = createGate) => {
  const base = os.$context<Context>();

  const authed = base.middleware(({ context, next }) => {
    if (context.authorization !== "Bearer token") {
      throw new ORPCError("UNAUTHORIZED", { message: "Missing token" });
    }
    return next({ context: { user: "admin" } });
  });

  return {
    health: base.handler(() => "ok" as const),
    double: base.input(z.number()).handler(({ input }) => input * 2),
    negate: base.input(z.boolean()).handler(({ input }) => !input),
    shout: base.input(z.string()).handler(({ input }) => input.toUpperCase()),
    noop: base.handler(() => {}),
    held: base.handler(async () => {
      const gate = getGate();
      gate.markStarted();
      await gate.released;
      return "released";
    }),
    fail: base.input(z.object({ code: z.string(), status: z.number().optional() })).handler(({ input }) => {
      throw new ORPCError(input.code, { status: input.status, message: `Failed with ${input.code}` });
    }),
    crash: base.handler(() => {
      throw new Error("Unexpected crash");
    }),
    badOutput: base.output(z.object({ id: z.number() })).handler(() => ({ id: "1" }) as unknown as { id: number }),
    me: base.use(authed).handler(({ context }) => context.user),
    ticks: base.handler(async function* ticks() {
      yield 1;
    }),
    user: {
      byId: base
        .route({ method: "GET" })
        .input(z.object({ id: z.number() }))
        .errors({ NOT_FOUND: { message: "User not found", data: z.object({ id: z.number() }) } })
        .handler(({ input, errors }) => {
          const user = users.find(({ id }) => id === input.id);
          if (!user) {
            throw errors.NOT_FOUND({ data: { id: input.id } });
          }
          return user;
        }),
      list: base
        .input(z.object({ limit: z.number().optional() }).optional())
        .handler(({ input }) => users.slice(0, input?.limit ?? users.length)),
      create: base.input(z.object({ name: z.string() })).handler(({ input }): User => ({ id: 3, name: input.name })),
    },
    types: {
      nextDay: base.input(z.object({ date: z.date(), total: z.bigint() })).handler(({ input }) => ({
        date: new Date(input.date.getTime() + DAY),
        total: input.total * 2n,
        tags: new Set(["a", "b"]),
        scores: new Map([["a", 1]]),
        sparse: [1, undefined],
        site: new URL("https://orpc.dev/docs"),
        notANumber: Number.NaN,
        pattern: /orpc/gi,
      })),
      upload: base.input(z.object({ name: z.string(), file: z.instanceof(Blob) })).handler(async ({ input }) => ({
        name: input.name,
        fileName: input.file instanceof File ? input.file.name : "blob",
        size: input.file.size,
        text: await input.file.text(),
      })),
      epoch: base.handler(() => ({ at: new Date(0), tags: new Set(["a"]) })),
      download: base.handler(() => ({
        file: new File(["hello"], "hello.txt", { type: "text/plain" }),
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      })),
    },
  };
};

export type AppRouter = ReturnType<typeof createAppRouter>;

/**
 * Real oRPC server listening on a random local port.
 */
export const createE2EOrpcServer = (
  router: AnyRouter,
  {
    prefix = "/rpc",
    handlerOptions,
  }: { prefix?: `/${string}`; handlerOptions?: { strictGetMethodPluginEnabled?: boolean } } = {},
) => {
  const requests: RecordedRequest[] = [];
  const handler = new RPCHandler<Context>(router, handlerOptions);

  const server = createServer(async (req, res) => {
    requests.push({ method: req.method, url: req.url, contentType: req.headers["content-type"] });

    const { matched } = await handler.handle(req, res, {
      prefix,
      context: { authorization: req.headers.authorization },
    });

    if (!matched) {
      res.statusCode = 404;
      res.end("No procedure matched");
    }
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

  return { startServer, stopServer, requests };
};
