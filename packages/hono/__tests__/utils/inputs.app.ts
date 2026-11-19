import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { validator } from "hono/validator";

const parseTitle = (value: unknown): { title: string; draft?: boolean } => {
  if (typeof value === "object" && value !== null && "title" in value && typeof value.title === "string") {
    const draft = "draft" in value && typeof value.draft === "boolean" ? value.draft : undefined;
    return draft === undefined ? { title: value.title } : { title: value.title, draft };
  }
  throw new Error("Invalid post");
};

/**
 * A Hono app with every validator target: `json`, `query` with arrays, `form`, `header`, `cookie`
 * and `param`, a route that combines several, and a validator that answers with its own error.
 */
export const inputsApp = new Hono()
  .post("/posts", validator("json", parseTitle), (c) => c.json(c.req.valid("json"), 201))
  .get(
    "/search",
    validator("query", (value) => value),
    (c) => c.json({ query: c.req.valid("query"), tags: c.req.queries("tags") ?? [] }),
  )
  .post(
    "/upload",
    validator("form", (value) => value),
    (c) => {
      const { title } = c.req.valid("form");
      return c.json({
        title: typeof title === "string" ? title : null,
        contentType: c.req.header("content-type") ?? null,
      });
    },
  )
  .get(
    "/whoami",
    validator("header", (value) => ({ requestId: value["x-request-id"] ?? null })),
    validator("cookie", (value) => ({ session: value.session ?? null })),
    (c) => c.json({ ...c.req.valid("header"), ...c.req.valid("cookie"), raw: getCookie(c, "session") ?? null }),
  )
  .put(
    "/posts/:postId",
    validator("param", (value) => ({ postId: Number(value.postId) })),
    validator("json", parseTitle),
    validator("query", (value) => ({ notify: value.notify === "true" })),
    (c) => c.json({ ...c.req.valid("param"), ...c.req.valid("json"), ...c.req.valid("query") }),
  )
  .post(
    "/strict",
    validator("json", (value, c) => {
      if (typeof value !== "object" || value === null || !("name" in value)) {
        return c.json({ error: "Name is required" as const }, 400);
      }
      return { name: String(value.name) };
    }),
    (c) => c.json({ name: c.req.valid("json").name }, 200),
  );
