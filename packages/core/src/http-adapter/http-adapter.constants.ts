import { Time } from "constants/time.constants";

import type { HttpAdapterExtraType } from "./http-adapter.types";

export const defaultTimeout = Time.SEC * 5;

/**
 * Default `extra` of the `HttpAdapter`. It holds the response headers, so it starts empty and is used until a response
 * arrives, and for requests that fail before the server answers.
 */
export const httpExtra: HttpAdapterExtraType = {
  headers: {},
};

/**
 * @deprecated Use `httpExtra`. The `HttpAdapter` sends requests with `fetch`, not `XMLHttpRequest`.
 */
export const xhrExtra: HttpAdapterExtraType = httpExtra;
