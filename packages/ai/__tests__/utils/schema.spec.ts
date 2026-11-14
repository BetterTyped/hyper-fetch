import { getJSONSchema, isStandardSchema, SchemaValidationError, validateSchema } from "@hyper-fetch/ai";
import { z } from "zod";

describe("Standard Schema helpers", () => {
  const schema = z.object({ name: z.string(), age: z.number().int() });

  it("should recognize Standard Schemas", () => {
    expect(isStandardSchema(schema)).toBe(true);
    expect(isStandardSchema({})).toBe(false);
    expect(isStandardSchema(null)).toBe(false);
  });

  it("should validate and return typed values", async () => {
    const result = await validateSchema(schema, { name: "Ann", age: 3 });
    expect(result).toEqual({ success: true, value: { name: "Ann", age: 3 } });
  });

  it("should return a SchemaValidationError with paths in the message", async () => {
    const result = await validateSchema(schema, { name: 1, age: 1.5 }, "Person");
    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error).toBeInstanceOf(SchemaValidationError);
    expect(result.error.message).toContain("Person: ");
    expect(result.error.message).toContain("name");
    expect(result.error.message).toContain("age");
    expect(result.error.issues.length).toBe(2);
  });

  it("should support async schemas", async () => {
    const asyncSchema = z.string().refine(async (value) => value === "ok");
    await expect(validateSchema(asyncSchema, "ok")).resolves.toEqual({ success: true, value: "ok" });
    await expect(validateSchema(asyncSchema, "no")).resolves.toMatchObject({ success: false });
  });

  it("should read JSON Schemas from schemas implementing Standard JSON Schema", () => {
    const jsonSchema = { type: "object", properties: { q: { type: "string" } } };
    const withJsonSchema = {
      "~standard": {
        version: 1,
        vendor: "test",
        validate: (value: unknown) => ({ value }),
        jsonSchema: { input: () => jsonSchema },
      },
    };
    expect(getJSONSchema(withJsonSchema)).toBe(jsonSchema);
    expect(getJSONSchema(schema)).toBeUndefined();
    expect(getJSONSchema(undefined)).toBeUndefined();
  });

  it("should not throw when JSON Schema conversion fails", () => {
    const failing = {
      "~standard": {
        version: 1,
        vendor: "test",
        validate: (value: unknown) => ({ value }),
        jsonSchema: {
          input: () => {
            throw new Error("unsupported");
          },
        },
      },
    };
    expect(getJSONSchema(failing)).toBeUndefined();
  });
});
