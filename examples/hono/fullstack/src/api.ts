import { createClient, createSdk } from "@hyper-fetch/core";

// Type-only import: the server code never reaches the browser bundle.
import type { AppSchema } from "../server/app";

/** The Hono app runs on the same origin as the page, inside the Vite dev server. */
export const client = createClient<{ error: { message: string } }>({ url: window.location.origin });

/** Paths, params, payloads and responses all come from the Hono routes. */
export const sdk = createSdk<typeof client, AppSchema>(client);

// Every SDK property access builds a new request, so keep one reference per endpoint.
export const getNotes = sdk.api.notes.$get;
export const createNote = sdk.api.notes.$post;
export const deleteNote = sdk.api.notes.$noteId.$delete;
