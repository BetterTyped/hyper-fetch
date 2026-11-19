import { Elysia, t } from "elysia";

export type User = { id: string; name: string };

const users = new Elysia({ prefix: "/users" })
  .get("/", (): User[] => [{ id: "1", name: "Ann" }])
  .post(
    "/",
    ({ body, status }) => {
      const user: User = { id: "2", name: body.name };
      return status(201, user);
    },
    { body: t.Object({ name: t.String() }) },
  )
  .get("/:userId", ({ params, status }) => {
    if (params.userId === "missing") {
      return status(404, { message: "User not found" });
    }
    const user: User = { id: params.userId, name: "Ann" };
    return user;
  })
  .get("/:userId/posts", ({ params, query }) => ({ userId: params.userId, page: query.page }), {
    query: t.Object({ page: t.String() }),
  });

const auth = new Elysia({ prefix: "/auth" })
  .get("/google-login", () => ({ authUrl: "https://accounts.example.com" }))
  .delete("/session", () => ({ loggedOut: true as const }));

const files = new Elysia({ prefix: "/files" }).get("/:fileId?", ({ params }) => ({ fileId: params.fileId ?? null }));

/**
 * An Elysia app with plugins, params, an optional param, kebab-case paths, body and query schemas,
 * error statuses, and the WebSocket, `.all()` and wildcard routes the schema leaves out.
 */
export const app = new Elysia()
  .get("/", () => ({ ok: true as const }))
  .use(users)
  .use(auth)
  .use(files)
  .ws("/live", { message: (ws, message) => ws.send(message) })
  .all("/anything", () => "anything")
  .get("/assets/*", () => "asset")
  .get("/maintenance", ({ status }) => status(503, { retryAfter: 60 }))
  .route("PROPFIND", "/dav", () => ({ dav: true as const }));

export const apiApp = new Elysia({ prefix: "/api" }).use(users);

export const groupApp = new Elysia().group("/v1", (group) => group.use(users));
