import { RPCHandler } from "@orpc/server/fetch";
import { Hono } from "hono";

import { router } from "./router";

const handler = new RPCHandler(router);

// The fetch handler takes a standard `Request`, so any server that speaks the Fetch API can host the router.
const app = new Hono().all("/api/rpc/*", async (c) => {
  const { matched, response } = await handler.handle(c.req.raw, {
    prefix: "/api/rpc",
  });
  return matched ? response : c.notFound();
});

// `@hono/vite-dev-server` serves the default export inside the Vite dev server.
export default app;
