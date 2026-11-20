import type { ClientInstance, RequestInstance, RequestJSON } from "@hyper-fetch/core";

/**
 * The endpoint as the user's adapter presents it, e.g. a GraphQL operation name instead of the whole document.
 * Endpoints arrive as JSON, so a non-string endpoint (like a GraphQL document) is never rendered as is.
 */
export const getDisplayEndpoint = (
  request: Pick<RequestJSON<RequestInstance>, "endpoint" | "requestOptions">,
  client: ClientInstance,
): string => {
  const { endpoint, requestOptions } = request;
  try {
    const name = client.adapter.unstable_devtoolsEndpointGetter(endpoint, requestOptions);
    if (typeof name === "string") {
      return name;
    }
  } catch {
    // Fall through to the raw endpoint
  }
  return typeof endpoint === "string" ? endpoint : JSON.stringify(endpoint);
};
