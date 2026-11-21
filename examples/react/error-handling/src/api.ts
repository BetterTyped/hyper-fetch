import { createClient } from "@hyper-fetch/core";

/**
 * The global error type: every request of this client can fail with it.
 * dummyjson errors carry a `message`, and so do the `Error` objects HyperFetch returns for network failures and timeouts.
 */
export type ApiError = { message: string };

export const client = createClient<{ error: ApiError }>({ url: "https://dummyjson.com" });

/** Problem details (RFC 9457) that only the `/http/:status` endpoint returns. */
export type ProblemDetails = {
  status: number;
  title: string;
  detail: string;
  message: string;
};

/**
 * dummyjson answers `/http/<status>` with that status, so the app can show every error state on demand.
 * The `error` generic adds `ProblemDetails` to the global `ApiError`: `error` is `ProblemDetails | ApiError`.
 */
export const getStatus = client.createRequest<{
  response: { status: number; message: string };
  error: ProblemDetails;
}>()({
  endpoint: "/http/:status",
});
