import { serve } from "@hono/node-server";
import type { ServerType } from "@hono/node-server";
import type { AddressInfo } from "node:net";

type FetchApp = { fetch: (request: Request) => Response | Promise<Response> };

/** Serves a Hono app on a free port and resolves with the server and its base URL. */
export const startServer = (app: FetchApp) =>
  new Promise<{ server: ServerType; url: string }>((resolve) => {
    const server = serve({ fetch: app.fetch, port: 0 }, () => {
      resolve({ server, url: `http://localhost:${(server.address() as AddressInfo).port}` });
    });
  });

export const stopServer = (server: ServerType) =>
  new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
