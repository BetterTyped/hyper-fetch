import { Elysia, file, form, sse, t } from "elysia";

const auth = new Elysia({ name: "auth" }).macro({
  auth: {
    resolve: ({ headers, status }) => {
      if (headers.authorization !== "Bearer token") {
        return status(403, { reason: "forbidden" as const });
      }
      return { userId: "1" };
    },
  },
});

const level = new Elysia({ prefix: "/level" })
  .get("/", () => "level-index" as const)
  .get("/level", () => "level-level" as const)
  .get("/:id/ok", ({ params }) => ({ id: params.id }));

/**
 * Routes for the cases Elysia's own Eden client tests: values JSON can not carry, every body and
 * query schema shape, plugin composition, and paths that look like keywords.
 */
export const edgeApp = new Elysia()
  .use(auth)
  .use(level)
  .model({ credentials: t.Object({ username: t.String(), password: t.String() }) })
  .get("", () => "root" as const)
  .get("/search/index/:indexId/stocks", ({ params }) => ({ indexId: params.indexId }))
  .get("/number", () => 1 as const)
  .get("/true", () => true)
  .get("/null", () => null)
  .get("/void", () => {
    // Responds with an empty body
  })
  .get("/date", () => ({ date: new Date("2026-01-02T03:04:05.000Z"), history: [new Date(0)] }))
  .get("/generator", function* generator() {
    yield "a";
    yield "b";
  })
  .get("/async-generator", async function* asyncGenerator() {
    yield "a";
    return "b";
  })
  .get("/sse", function* events() {
    yield sse({ event: "tick", data: { count: 1 } });
  })
  .get("/stream", () => new ReadableStream<string>())
  .get("/response", () => new Response("raw text"))
  .get("/redirect", ({ redirect, request }) => redirect(new URL("/number", request.url).toString()))
  .get("/form", () => form({ name: "report", file: file(new Blob(["content"]).toString()) }))
  .get("/teapot", ({ status }) => status("I'm a teapot", { brewing: false as const }))
  .get("/multiple-choices", ({ status }) => status(300, { choices: ["a", "b"] }))
  .get("/schema-statuses", () => {}, {
    response: { 200: t.Void(), 418: t.Literal("teapot"), 420: t.Literal("calm") },
  })
  .get("/secret", ({ userId }) => ({ userId }), { auth: true })
  .head("/head", () => "head")
  .options("/options", () => "options")
  .post("/deep/nested/mirror", ({ body }) => body, { body: "credentials" })
  .post("/string", ({ body }) => body, { body: t.String() })
  .post("/array", ({ body }) => body, { body: t.Array(t.String()) })
  .post("/optional-body", ({ body }) => ({ received: body ?? null }), {
    body: t.Optional(t.Object({ note: t.String() })),
  })
  .post("/union-body", ({ body }) => body, {
    body: t.Union([t.Object({ a: t.String() }), t.Object({ b: t.Number() })]),
  })
  .post("/date-body", ({ body }) => ({ year: body.date.getUTCFullYear() }), { body: t.Object({ date: t.Date() }) })
  .post("/upload", ({ body }) => ({ name: body.title, size: body.file.size }), {
    body: t.Object({ title: t.String(), file: t.File() }),
  })
  .post("/uploads", ({ body }) => ({ count: body.files.length }), { body: t.Object({ files: t.Files() }) })
  .post("/no-schema", ({ body }) => ({ body: body ?? null }))
  .delete("/empty", () => ({ deleted: true as const }))
  .get(
    "/query-types",
    ({ query }) => ({ day: query.day.toISOString(), count: query.count, note: query.note ?? null }),
    {
      query: t.Object({ day: t.Date(), count: t.Numeric(), note: t.Optional(t.String()) }),
    },
  )
  .get("/query-literal", ({ query }) => query, { query: t.Object({ alias: t.Literal("Kristen") }) })
  .get("/query-array", ({ query }) => query, { query: t.Object({ tags: t.Array(t.String()) }) })
  .get("/query-partial", ({ query }) => query, { query: t.Partial(t.Object({ page: t.String() })) })
  .get("/query-optional", ({ query }) => query ?? null, { query: t.Optional(t.Object({ page: t.String() })) })
  .get("/query-unknown", ({ query }) => query, { query: t.Unknown() })
  .get("/query-empty", () => "empty", { query: t.Object({}) })
  .guard({ query: t.Object({ token: t.String() }) }, (app) =>
    app.get("/guarded", ({ query }) => ({ token: query.token })),
  )
  .group("/nested", (app) => app.guard({}, (guarded) => guarded.get("/data", () => ({ nested: true as const }))))
  .get("/params/:count", ({ params }) => ({ count: params.count }), { params: t.Object({ count: t.Number() }) })
  .get("/headers", ({ headers }) => ({ username: headers.username }), {
    headers: t.Object({ username: t.String() }),
  })
  .get("/throws", (): { never: true } => {
    throw new Error("Unexpected failure");
  })
  .get("/a/b/c/d/e/f/g/h", () => ({ depth: 8 as const }))
  .get("/json-serialization-deserialization", () => ({ ok: true as const }))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .get("/any", (): any => JSON.parse('{"loose":true}'))
  .get("/any-schema", () => ({ loose: true }), { response: t.Any() })
  .post("/optional-file", ({ body }) => ({ hasFile: Boolean(body.file) }), {
    body: t.Object({ file: t.Optional(t.File()) }),
  })
  .mount("/mounted", () => new Response("mounted"));

export const rootParamApp = new Elysia().get("/:id", ({ params }) => ({ id: params.id }));
