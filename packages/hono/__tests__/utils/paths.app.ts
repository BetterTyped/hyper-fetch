import { Hono } from "hono";
import { appendTrailingSlash } from "hono/trailing-slash";

const files = new Hono().get("/:fileId?", (c) => c.json({ fileId: c.req.param("fileId") ?? null }));

const sharedReads = new Hono().get("/", (c) => c.json({ read: true as const }));
const sharedWrites = new Hono().post("/", (c) => c.json({ written: true as const }));

/**
 * A Hono app with every kind of path segment: optional and regex params, wildcards, `.all()`,
 * `app.on()` with several methods or paths, paths without a leading slash or with a trailing
 * slash (served through `appendTrailingSlash()`), two routers on one path, and a deeply nested route.
 */
export const pathsApp = new Hono()
  .use("/slash", appendTrailingSlash())
  .route("/files", files)
  .get("/versions/:major/:minor?/:patch?", (c) => c.json(c.req.param()))
  .get("/posts/:postId{[0-9]+}", (c) => c.json({ postId: c.req.param("postId") }))
  .get("/archive/:year{[0-9]{4}}/:slug", (c) => c.json(c.req.param()))
  .get("/assets/*", (c) => c.json({ path: c.req.path }))
  .all("/echo", (c) => c.json({ method: c.req.method }))
  .on(["PUT", "PATCH"], "/items/:itemId", (c) => c.json({ method: c.req.method, itemId: c.req.param("itemId") }))
  .on("GET", ["/health", "/status"], (c) => c.json({ up: true as const }))
  .get("plain", (c) => c.json({ plain: true as const }))
  .get("/slash/", (c) => c.json({ slash: true as const }))
  .route("/shared", sharedReads)
  .route("/shared", sharedWrites)
  .get("/l1/l2/l3/l4/l5/l6/l7/l8/l9/l10/l11/:leaf", (c) => c.json({ leaf: c.req.param("leaf") }));

/** Optional params on the root path resolve to the top level. */
export const rootOptionalApp = new Hono().get("/:lang?", (c) => c.json({ lang: c.req.param("lang") ?? null }));
