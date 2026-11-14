import type { JSONSchemaType, StandardJSONSchemaSourceType, StandardSchemaV1 } from "./standard-schema.types";

/** Thrown when a value does not match its Standard Schema. */
export class SchemaValidationError extends Error {
  readonly issues: readonly StandardSchemaV1.Issue[];
  readonly value: unknown;

  constructor(issues: readonly StandardSchemaV1.Issue[], value: unknown, context?: string) {
    const details = issues
      .map((issue) => {
        const path = issue.path
          ?.map((segment) => (typeof segment === "object" ? String(segment.key) : String(segment)))
          .join(".");
        return path ? `${path}: ${issue.message}` : issue.message;
      })
      .join("; ");
    super(`${context ? `${context}: ` : ""}${details || "Validation failed"}`);
    this.name = "SchemaValidationError";
    this.issues = issues;
    this.value = value;
  }
}

export const isStandardSchema = (value: unknown): value is StandardSchemaV1 => {
  return (
    !!value &&
    (typeof value === "object" || typeof value === "function") &&
    "~standard" in value &&
    typeof (value as StandardSchemaV1)["~standard"]?.validate === "function"
  );
};

export type SchemaValidationResultType<Output> =
  | { success: true; value: Output }
  | { success: false; error: SchemaValidationError };

/** Validate a value with any Standard Schema (sync or async). */
export const validateSchema = async <Schema extends StandardSchemaV1>(
  schema: Schema,
  value: unknown,
  context?: string,
): Promise<SchemaValidationResultType<StandardSchemaV1.InferOutput<Schema>>> => {
  const result = await schema["~standard"].validate(value);
  if (result.issues) {
    return { success: false, error: new SchemaValidationError(result.issues, value, context) };
  }
  return { success: true, value: result.value as StandardSchemaV1.InferOutput<Schema> };
};

/**
 * Get a JSON Schema for a Standard Schema that supports the Standard JSON Schema proposal (e.g. Zod 4.2+).
 * Returns `undefined` when the schema can't describe itself - pass an explicit JSON Schema in that case.
 */
export const getJSONSchema = (schema: unknown): JSONSchemaType | undefined => {
  const source = schema as Partial<StandardJSONSchemaSourceType> | undefined;
  const input = source?.["~standard"]?.jsonSchema?.input;
  if (typeof input !== "function") {
    return undefined;
  }
  try {
    return input({ target: "draft-2020-12" });
  } catch {
    return undefined;
  }
};
