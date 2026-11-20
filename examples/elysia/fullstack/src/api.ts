import { createClient, createSdk } from "@hyper-fetch/core";

// Type-only import: the server code never reaches the browser bundle.
import type { AppSchema } from "../server/app";

/** Same origin as the page: in development Vite forwards `/api` to the Elysia server. */
export const client = createClient({ url: window.location.origin });

/** Paths, params, query params, payloads, responses and error bodies all come from the Elysia routes. */
export const sdk = createSdk<typeof client, AppSchema>(client);

// Every SDK property access builds a new request, so keep one reference per endpoint.
export const getBookmarks = sdk.api.bookmarks.$get;
export const createBookmark = sdk.api.bookmarks.$post;
export const deleteBookmark = sdk.api.bookmarks.$bookmarkId.$delete;
