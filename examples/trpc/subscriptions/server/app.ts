import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { Hono } from "hono";

import { appRouter } from "./router";

// tRPC's fetch adapter takes a standard `Request`, so any server that speaks the Fetch API can host the router.
const app = new Hono().all("/api/trpc/*", (c) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
  }),
);

// `@hono/vite-dev-server` serves the default export inside the Vite dev server.
export default app;
