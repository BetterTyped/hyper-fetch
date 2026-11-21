import { createClient, createSdk } from "@hyper-fetch/core";

// Type-only import: the server code never reaches the browser bundle.
import type { AppSchema } from "../server/app";

/** Same origin as the page: in development Vite forwards `/api` to the Elysia server. */
export const client = createClient({ url: window.location.origin });

/** Paths, params, query params, payloads, responses and error bodies all come from the Elysia routes. */
export const sdk = createSdk<typeof client, AppSchema>(client);
