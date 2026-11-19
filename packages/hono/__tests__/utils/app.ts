import { Hono } from "hono";
import { validator } from "hono/validator";

export type User = { id: string; name: string };

const parseNewUser = (value: unknown): { name: string } => {
  if (typeof value === "object" && value !== null && "name" in value && typeof value.name === "string") {
    return { name: value.name };
  }
  throw new Error("Invalid user");
};

const parsePostsQuery = (value: Record<string, string | string[]>): { page: string } => {
  const { page } = value;
  return { page: typeof page === "string" ? page : "1" };
};

const users = new Hono()
  .get("/", (c) => c.json<User[]>([{ id: "1", name: "Ann" }]))
  .post("/", validator("json", parseNewUser), (c) => c.json<User>({ id: "2", name: c.req.valid("json").name }, 201))
  .get("/:userId", (c) => {
    const userId = c.req.param("userId");
    if (userId === "missing") {
      return c.json({ message: "User not found" }, 404);
    }
    return c.json<User>({ id: userId, name: "Ann" });
  })
  .get("/:userId/posts", validator("query", parsePostsQuery), (c) =>
    c.json({ userId: c.req.param("userId"), page: c.req.valid("query").page }),
  );

const auth = new Hono()
  .get("/google-login", (c) => c.json({ authUrl: "https://accounts.example.com" }))
  .delete("/session", (c) => c.json({ loggedOut: true }));

/** A Hono app with mounted routers, params, kebab-case paths, a JSON validator and a query validator. */
export const app = new Hono()
  .get("/", (c) => c.json({ ok: true }))
  .route("/users", users)
  .route("/auth", auth);

export const apiApp = new Hono().basePath("/api").route("/users", users);
