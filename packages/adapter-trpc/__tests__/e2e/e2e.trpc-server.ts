import type { AnyTRPCRouter } from "@trpc/server";
import { initTRPC, TRPCError } from "@trpc/server";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import type { AddressInfo } from "net";
import superjson from "superjson";

export type User = { id: number; name: string };

export type RecordedRequest = { method?: string; url?: string; contentType?: string };

const users: User[] = [
  { id: 1, name: "John" },
  { id: 2, name: "Jane" },
];

const parseId = (value: unknown) => {
  const { id } = (value ?? {}) as { id?: unknown };
  if (typeof id !== "number") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Id has to be a number" });
  }
  return { id };
};

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

export const createAppRouter = (getGate: () => Gate) => {
  const t = initTRPC.create();

  return t.router({
    health: t.procedure.query(() => "ok" as const),
    double: t.procedure.input((value) => value as number).query(({ input }) => input * 2),
    createdAt: t.procedure.query(() => new Date("2024-01-01T00:00:00.000Z")),
    noop: t.procedure.mutation(() => {}),
    rename: t.procedure.input((value) => value as string).mutation(({ input }) => input.toUpperCase()),
    held: t.procedure.query(async () => {
      const gate = getGate();
      gate.markStarted();
      await gate.released;
      return "released";
    }),
    fail: t.procedure
      .input((value) => value as { code: TRPCError["code"] })
      .query(({ input }) => {
        throw new TRPCError({ code: input.code, message: `Failed with ${input.code}` });
      }),
    crash: t.procedure.query(() => {
      throw new Error("Unexpected crash");
    }),
    onUser: t.procedure.subscription(async function* onUser() {
      yield users[0];
    }),
    user: t.router({
      byId: t.procedure.input(parseId).query(({ input }) => {
        const user = users.find(({ id }) => id === input.id);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }
        return user;
      }),
      list: t.procedure
        .input((value) => value as { limit?: number } | undefined)
        .query(({ input }) => users.slice(0, input?.limit ?? users.length)),
      create: t.procedure
        .input((value) => value as { name: string })
        .mutation(({ input }): User => ({ id: 3, name: input.name })),
    }),
  });
};

export const createTransformerRouter = () => {
  const t = initTRPC.create({ transformer: superjson });

  return t.router({
    nextDay: t.procedure
      .input((value) => value as { date: Date })
      .query(({ input }) => ({
        date: new Date(input.date.getTime() + 24 * 60 * 60 * 1000),
        tags: new Set(["a", "b"]),
      })),
    save: t.procedure
      .input((value) => value as { date: Date; total: bigint })
      .mutation(({ input }) => ({ isDate: input.date instanceof Date, total: input.total * 2n })),
    nothing: t.procedure.query(() => {}),
    fail: t.procedure.query(() => {
      throw new TRPCError({ code: "CONFLICT", message: "Already exists" });
    }),
  });
};

export type AppRouter = ReturnType<typeof createAppRouter>;
export type TransformerRouter = ReturnType<typeof createTransformerRouter>;

/**
 * Real tRPC server listening on a random local port.
 */
export const createE2ETrpcServer = (router: AnyTRPCRouter) => {
  const requests: RecordedRequest[] = [];

  const server = createHTTPServer({
    router,
    createContext: ({ req }) => {
      requests.push({ method: req.method, url: req.url, contentType: req.headers["content-type"] });
      return {};
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

  return { startServer, stopServer, requests };
};
