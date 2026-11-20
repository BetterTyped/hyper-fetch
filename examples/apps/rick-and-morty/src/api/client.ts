import { createClient } from "@hyper-fetch/core";

/** One client for the whole app. Every request below inherits its base url and its cache. */
export const client = createClient({ url: "https://rickandmortyapi.com/api" });

/** The body the API sends with a 4xx status, for example `{ "error": "There is nothing here" }`. */
export type ApiError = { error: string };

/** Network failures, timeouts and aborts come back as an `Error`, API errors as `ApiError`. */
export const getErrorMessage = (error: ApiError | Error) => ("error" in error ? error.error : error.message);
