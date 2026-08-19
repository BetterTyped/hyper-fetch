export enum HttpMethods {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
  /** Safe, idempotent read with a request body (IETF draft-ietf-httpbis-safe-method-w-body). */
  QUERY = "QUERY",
}

/** Methods that are safe reads: routed to the fetch dispatcher and deduplicated by default. */
export const SAFE_HTTP_METHODS: string[] = [HttpMethods.GET, HttpMethods.QUERY];
