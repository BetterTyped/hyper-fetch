import { Time } from "@hyper-fetch/core";

import type { GraphQlExtraType } from "./adapter.types";

export const defaultTimeout = Time.SEC * 5;

/**
 * GraphQL over HTTP media type first, so spec compliant servers answer with meaningful status codes,
 * and JSON as the fallback for the others.
 */
export const gqlAcceptHeader = "application/graphql-response+json, application/json;q=0.9";

export const gqlExtra: GraphQlExtraType = {
  headers: {},
  extensions: {},
};
