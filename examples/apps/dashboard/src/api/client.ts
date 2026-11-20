import { createClient } from "@hyper-fetch/core";

/** The error body dummyjson sends with a 4xx or 5xx status. */
export type ApiError = { message: string };

export const client = createClient<{ error: ApiError }>({ url: "https://dummyjson.com" });
