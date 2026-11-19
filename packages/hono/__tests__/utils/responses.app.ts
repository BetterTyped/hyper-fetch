import { Hono } from "hono";
import { validator } from "hono/validator";

export interface Result {
  ok: boolean;
  note?: string;
}

/** Lets a test pick the branch a handler takes with `?flag=yes`. */
const flag = validator("query", (value) => ({ flag: value.flag === "yes" }));

/**
 * A Hono app with every kind of handler output: JSON primitives, `null`, `{}`, dates, interfaces,
 * unions, several statuses, a middleware that answers early, `c.text()`, `c.body()`,
 * `c.redirect()`, `c.newResponse()` and `c.notFound()`.
 */
export const responsesApp = new Hono()
  .get("/json/string", (c) => c.json("a-string"))
  .get("/json/number", (c) => c.json(37))
  .get("/json/boolean", (c) => c.json(true))
  .get("/json/null", (c) => c.json(null))
  .get("/json/empty", (c) => c.json({}))
  .get("/json/date", (c) => c.json({ at: new Date("2024-01-01T00:00:00.000Z") }))
  .get("/json/interface", (c) => {
    const results: Result[] = [{ ok: true }];
    return c.json(results);
  })
  .get("/json/union", flag, (c) => (c.req.valid("query").flag ? c.json({ data: "foo" }) : c.json({ message: "error" })))
  .get("/statuses", flag, (c) => {
    if (c.req.valid("query").flag) {
      return c.json({ message: "Bad request" }, 400);
    }
    return c.json({ data: "foo" }, 200);
  })
  .post(
    "/guarded",
    async (c, next) => {
      if (!c.req.header("authorization")) {
        return c.json({ error: "Unauthorized" as const }, 401);
      }
      await next();
    },
    (c) => c.json({ created: true as const }, 201),
  )
  .get("/text", (c) => c.text("Hello, Hono!"))
  .get("/text/numeric", (c) => c.text("42"))
  .get("/body", (c) => c.body("raw body"))
  .delete("/body/empty", (c) => c.body(null, 204))
  .get("/body/null", (c) => c.body(null))
  .get("/redirect", flag, (c) =>
    c.req.valid("query").flag ? c.redirect("/text") : c.json({ stayed: true as const }, 200),
  )
  .get("/new-response", (c) => c.newResponse("custom", 202))
  .get("/not-found", (c) => c.notFound());
