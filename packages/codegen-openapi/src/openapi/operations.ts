import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

import { HttpMethod } from "./http-methods.enum";
import { Operation } from "./openapi.types";

export function getAvailableOperations(openApiJson: OpenAPIV3.Document | OpenAPIV3_1.Document): Partial<Operation>[] {
  const paths = openApiJson.paths || {};
  return Object.entries(paths).flatMap(([path, pathObject]) => {
    return Object.values(HttpMethod)
      .map((method) => ({ path, method, operation: pathObject[method] }))
      .filter(({ operation }) => operation)
      .map(({ operation, method }) => {
        const op: Partial<Operation> = {
          ...operation,
          path,
          method,
        };
        return op;
      });
  });
}
