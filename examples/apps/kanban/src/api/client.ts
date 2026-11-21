import { createClient } from "@hyper-fetch/core";

/** The error body of the API, typed once for every request of the client. */
export type ApiError = { message: string };

/**
 * There is no real backend: every request is answered by the mock server in `mock-server.ts`.
 * Point `url` at your API and delete that file, and nothing else changes.
 */
export const client = createClient<{ error: ApiError }>({ url: "/api" });
