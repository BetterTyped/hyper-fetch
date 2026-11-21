import { createClient, createSdk } from "@hyper-fetch/core";
import { createSocketSdk, Socket } from "@hyper-fetch/sockets";
import { TrpcAdapter, TrpcSseAdapter, type TrpcSchema, type TrpcSocketSchema } from "@hyper-fetch/trpc";

// Type-only import: the router code never reaches the browser bundle.
import type { AppRouter } from "../server/router";

/** Both connect to the same tRPC handler, mounted in server/app.ts. */
const url = `${window.location.origin}/api/trpc`;

/** Queries and mutations: plain HTTP requests through the `TrpcAdapter`. */
export const client = createClient({ url }).setAdapter(TrpcAdapter());
export const sdk = createSdk<typeof client, TrpcSchema<AppRouter>>(client, {
  camelCaseToKebabCase: false,
});

/** Subscriptions: a socket whose adapter opens one Server-Sent Events stream per subscription. */
export const socket = new Socket({ url, adapter: TrpcSseAdapter() });
export const realtime = createSocketSdk<typeof socket, TrpcSocketSchema<AppRouter>>(socket, {
  camelCaseToKebabCase: false,
});
