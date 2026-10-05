import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

import { HttpMethod } from "./http-methods.enum";
import type { Operation } from "./openapi.types";

export function getAvailableOperations(openApiJson: OpenAPIV3.Document | OpenAPIV3_1.Document) {
  const paths = openApiJson.paths || {};
  return Object.entries(paths).flatMap(([path, pathObject]) => {
    return Object.values(HttpMethod)
      .map((method) => ({ path, method, operation: pathObject?.[method] }))
      .filter(({ operation }) => operation && typeof operation === "object")
      .map(({ operation, method }) => {
        // operationId is optional in the OpenAPI spec - operations without it are identified by path and method
        const op: { operationId?: string; path: string; method: string } & Partial<Operation> = {
          ...operation,
          path,
          method,
        };
        return op;
      });
  }) as ({ operationId?: string } & Operation)[];
}
