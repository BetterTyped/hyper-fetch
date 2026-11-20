import { createClient } from "@hyper-fetch/core";

/** The server sends every error as `{ message }`, see `onError` in server/app.ts. */
export type ApiError = { message: string };

/** The Hono API runs on the same origin as the page, inside the Vite dev server. */
export const client = createClient<{ error: ApiError }>({ url: window.location.origin });
