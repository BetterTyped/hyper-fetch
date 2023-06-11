import { HttpMethod, Operation } from "openapi-client-axios";

export function generateOperations(openApiJson) {
  const paths = openApiJson.paths || {};
  return Object.entries(paths).flatMap(([path, pathObject]: any) => {
    return Object.values(HttpMethod)
      .map((method) => ({ path, method, operation: pathObject[method] }))
      .filter(({ operation }) => operation)
      .map(({ operation, method }) => {
        const op: Partial<Operation> = {
          ...(typeof operation === "object" ? operation : {}),
          path,
          method: method as HttpMethod,
        };
        if (pathObject.parameters) {
          op.parameters = [...(op.parameters || []), ...pathObject.parameters];
        }
        return op as Operation;
      });
  });
}
