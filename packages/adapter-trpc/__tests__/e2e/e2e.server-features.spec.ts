/**
 * @vitest-environment node
 */
import { createClient, createSdk } from "@hyper-fetch/core";
import { initTRPC, lazy, TRPCError } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import type { TrpcSchema } from "../../src/adapter";
import { TrpcAdapter } from "../../src/adapter";
import { createE2ETrpcServer } from "./e2e.trpc-server";

type Context = { authorization?: string; url?: string };

const t = initTRPC.context<Context>().create({
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: { ...shape.data, reason: error.cause instanceof Error ? error.cause.message : null },
  }),
});

const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (ctx.authorization !== "Bearer secret") {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing token" });
  }
  return next({ ctx: { user: "admin" } });
});

const postsRouter = t.router({
  list: t.procedure.query(() => ["first post"]),
});

const commentsRouter = t.router({
  count: t.procedure.query(() => 3),
});

const router = t.mergeRouters(
  t.router({
    me: protectedProcedure.query(({ ctx }) => ctx.user),
    url: t.procedure.query(({ ctx }) => ctx.url ?? ""),
    square: t.procedure.input((value) => value as number).query(({ input }) => input * input),
    withCause: t.procedure.query(() => {
      throw new TRPCError({ code: "CONFLICT", message: "Conflict", cause: new Error("Duplicated key") });
    }),
    invalidOutput: t.procedure
      .output((value) => {
        if (typeof value !== "number") {
          throw new TypeError("Output has to be a number");
        }
        return value;
      })
      .query(() => "text" as unknown as number),
    posts: postsRouter,
    comments: lazy(async () => commentsRouter),
    a: t.router({ b: t.router({ c: t.router({ d: t.router({ leaf: t.procedure.query(() => "deep") }) }) }) }),
  }),
  t.router({ merged: t.procedure.query(() => "merged") }),
);

type Router = typeof router;

describe("Trpc Adapter [ Server Features ]", () => {
  const server = createE2ETrpcServer(router);
  const basePathServer = createE2ETrpcServer(router, { basePath: "/api/trpc/" });

  let url = "";
  let basePathUrl = "";

  const createAppClient = (clientUrl = url) => createClient({ url: clientUrl }).setAdapter(TrpcAdapter());
  const createApi = (client: ReturnType<typeof createAppClient>) => {
    return createSdk<typeof client, TrpcSchema<Router>>(client, { camelCaseToKebabCase: false });
  };

  beforeAll(async () => {
    url = await server.startServer();
    basePathUrl = await basePathServer.startServer();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await server.stopServer();
    await basePathServer.stopServer();
  });

  describe("when the router is composed", () => {
    it("should call a procedure from a merged router", async () => {
      const response = await createApi(createAppClient()).merged.$query.send();

      expect(response.data).toBe("merged");
    });

    it("should call a procedure from a nested router", async () => {
      const response = await createApi(createAppClient()).posts.list.$query.send();

      expect(response.data).toStrictEqual(["first post"]);
    });

    it("should call a procedure from a lazy router", async () => {
      const response = await createApi(createAppClient()).comments.count.$query.send();

      expect(response.data).toBe(3);
    });

    it("should call a deeply nested procedure", async () => {
      const response = await createApi(createAppClient()).a.b.c.d.leaf.$query.send();

      expect(response.data).toBe("deep");
    });
  });

  describe("when the procedure uses a middleware", () => {
    it("should reject a request without the token", async () => {
      const response = await createApi(createAppClient()).me.$query.send();

      expect(response.status).toBe(401);
      expect(response.error).toMatchObject({ message: "Missing token", data: { code: "UNAUTHORIZED" } });
    });

    it("should pass the token from onAuth", async () => {
      const client = createAppClient();
      client.onAuth((request) => request.setHeaders({ Authorization: "Bearer secret" }));

      const response = await createApi(client).me.$query.send();

      expect(response.data).toBe("admin");
    });

    it("should pass the token from the request headers", async () => {
      const response = await createApi(createAppClient())
        .me.$query.setHeaders({ Authorization: "Bearer secret" })
        .send();

      expect(response.data).toBe("admin");
    });
  });

  describe("when the server customizes the errors", () => {
    it("should return the fields added by the error formatter", async () => {
      const response = await createApi(createAppClient()).withCause.$query.send();

      expect(response.status).toBe(409);
      expect(response.error).toMatchObject({ data: { reason: "Duplicated key", code: "CONFLICT" } });
    });

    it("should report a failed output validation", async () => {
      const response = await createApi(createAppClient()).invalidOutput.$query.send();

      expect(response.status).toBe(500);
      expect(response.error).toMatchObject({ data: { code: "INTERNAL_SERVER_ERROR" } });
    });
  });

  describe("when the server is mounted on a path", () => {
    it.each([
      ["without a trailing slash", "/api/trpc"],
      ["with a trailing slash", "/api/trpc/"],
    ])("should call the procedure %s", async (_name, path) => {
      const response = await createApi(createAppClient(`${basePathUrl}${path}`))
        .square.$query.setPayload(4)
        .send();

      expect(response.data).toBe(16);
    });

    it("should report the wrong path", async () => {
      const response = await createApi(createAppClient(`${basePathUrl}/wrong`))
        .square.$query.setPayload(4)
        .send();

      expect(response.success).toBe(false);
      expect(response.status).toBe(404);
    });
  });

  describe("when the url has query params", () => {
    it("should keep the query string of the client url", async () => {
      const response = await createApi(createAppClient(`${url}?tenant=acme`)).url.$query.send();

      expect(response.data).toBe("/url?tenant=acme");
    });

    it("should send the request query params", async () => {
      const response = await createAppClient()
        .createRequest<{ response: string; queryParams: { source: string; tags: string[] } }>()({ endpoint: "url" })
        .setQueryParams({ source: "app", tags: ["a", "b"] })
        .send();

      expect(new URL(`${url}${response.data}`).searchParams.get("source")).toBe("app");
    });

    it("should not let the query params replace the input", async () => {
      const response = await createAppClient()
        .createRequest<{ response: number; payload: number; queryParams: { input: number; batch: number } }>()({
          endpoint: "square",
        })
        .setPayload(3)
        .setQueryParams({ input: 100, batch: 1 })
        .send();

      expect(response.data).toBe(9);
    });
  });

  describe("when many requests run at once", () => {
    it("should return the right result for every input", async () => {
      const client = createAppClient();
      const api = createApi(client);
      const inputs = Array.from({ length: 50 }, (_, index) => index + 1);

      const responses = await Promise.all(inputs.map((input) => api.square.$query.setPayload(input).send()));

      expect(responses.map(({ data }) => data)).toStrictEqual(inputs.map((input) => input * input));
    });

    it("should not mix the clients", async () => {
      const first = createAppClient();
      const second = createAppClient();
      first.onAuth((request) => request.setHeaders({ Authorization: "Bearer secret" }));

      const [authorized, rejected] = await Promise.all([
        createApi(first).me.$query.send(),
        createApi(second).me.$query.send(),
      ]);

      expect(authorized.data).toBe("admin");
      expect(rejected.status).toBe(401);
    });
  });

  describe("when the server runs on the fetch adapter", () => {
    beforeEach(() => {
      vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
        return fetchRequestHandler({
          endpoint: "/trpc",
          req: new Request(input, init),
          router,
          createContext: () => ({}),
        });
      });
    });

    it("should call a query", async () => {
      const client = createAppClient("http://edge.test/trpc");

      const response = await createApi(client).square.$query.setPayload(5).send();

      expect(response.data).toBe(25);
      expect(response.status).toBe(200);
    });

    it("should map an error", async () => {
      const client = createAppClient("http://edge.test/trpc");

      const response = await createApi(client).me.$query.send();

      expect(response.status).toBe(401);
      expect(response.error).toMatchObject({ data: { code: "UNAUTHORIZED", httpStatus: 401, path: "me" } });
    });
  });
});
