import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

export function adjustPathParamsFormat(path: string) {
  // Naive implementation for now:
  return path.replaceAll('}', "").replaceAll('{', ":");
}
export function createTypeBaseName(str: string) {
  const capitalizeFirstLetter = (s: string) => {
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  return str.split("_").map(capitalizeFirstLetter).join("");
}

export function normalizeOperationId(key: string): string {
  return key
    .replaceAll(/\/(.)/g, (_match: string, p1: string) => {
      return p1.toUpperCase();
    })
    .replaceAll('}', "")
    .replaceAll('{', "$")
    .replace(/^\//, "")
    .replaceAll(/[^0-9A-Za-z_$]+/g, "_");
}
export const isUrl = (schemaPath: string) => {
  try {
    return Boolean(new URL(schemaPath));
  } catch {
    return false;
  }
};

export function getBaseUrl(openApiJson: OpenAPIV3.Document | OpenAPIV3_1.Document): string {
  return openApiJson.servers?.[0]?.url ?? "";
}
