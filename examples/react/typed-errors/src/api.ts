import { createClient } from "@hyper-fetch/core";

/**
 * The global error type: what any request can fail with. HyperFetch reports network failures, timeouts and aborts as
 * `Error` objects (`TimeoutError`, `AbortError`...), while the server's error bodies arrive as plain JSON objects.
 */
export const client = createClient<{ error: Error }>({ url: "https://dummyjson.com" });

// ---------- Endpoint errors: the JSON each endpoint sends when it says no ----------

/** `GET /products/:id` with an unknown id. */
export type NotFoundError = { message: string };

/** `POST /auth/login` with wrong credentials. */
export type InvalidCredentialsError = { message: "Invalid credentials" };

/** RFC 9457 problem details, sent by the reservation endpoint. */
export type ProblemDetails = { status: number; title: string; detail: string };

// ---------- Requests: `error` adds the endpoint error to the global one ----------

export const getProduct = client.createRequest<{
  response: { id: number; title: string; price: number };
  error: NotFoundError;
}>()({ endpoint: "/products/:productId" });

export const login = client.createRequest<{
  response: { id: number; firstName: string; accessToken: string };
  payload: { username: string; password: string };
  error: InvalidCredentialsError;
}>()({ endpoint: "/auth/login", method: "POST" });

/** dummyjson answers `/http/:status/:message` with that status, which stands in for a reservation service. */
export const reserve = client.createRequest<{
  response: { status: number; message: string };
  error: ProblemDetails;
}>()({ endpoint: "/http/:status/:message", method: "POST" });
