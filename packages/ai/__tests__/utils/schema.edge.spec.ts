import type { StandardSchemaV1 } from "@hyper-fetch/ai";
import { getJSONSchema, isStandardSchema, SchemaValidationError, validateSchema } from "@hyper-fetch/ai";
import { convertSchemaToJsonSchema, isStandardSchema as tanstackIsStandardSchema } from "@tanstack/ai";
import { z } from "zod";

type ValidateType = StandardSchemaV1["~standard"]["validate"];

/** Minimal hand-written Standard Schema - no schema library involved */
const createSchema = <Output = unknown>(validate: ValidateType, extra: Record<string, unknown> = {}) =>
  ({ "~standard": { version: 1, vendor: "test", validate, ...extra } }) as StandardSchemaV1<unknown, Output>;

const issuesOf = async (schema: StandardSchemaV1, value: unknown, context?: string) => {
  const result = await validateSchema(schema, value, context);
  if (result.success) {
    throw new Error("Expected the validation to fail");
  }
  return result.error;
};

describe("Standard Schema helpers - edge cases", () => {
  describe("isStandardSchema", () => {
    it.each([
      ["a Zod object", z.object({ a: z.string() })],
      ["a Zod primitive", z.string()],
      ["a Zod schema with transforms", z.string().transform((value) => value.length)],
      ["a hand-written schema", createSchema((value) => ({ value }))],
      [
        "a callable schema (ArkType style)",
        Object.assign(
          () => {},
          createSchema((value) => ({ value })),
        ),
      ],
    ])("should accept %s", (_name, schema) => {
      expect(isStandardSchema(schema)).toBe(true);
    });

    it.each([
      ["undefined", undefined],
      ["null", null],
      ["a number", 1],
      ["a string", "~standard"],
      ["a boolean", true],
      ["a symbol", Symbol("~standard")],
      ["an empty object", {}],
      ["an array", []],
      ["a function", () => {}],
      ["a JSON Schema", { type: "object", properties: {} }],
      ["~standard: null", { "~standard": null }],
      ["~standard: undefined", { "~standard": undefined }],
      ["~standard without validate", { "~standard": { version: 1, vendor: "x" } }],
      ["a validate that is not a function", { "~standard": { version: 1, vendor: "x", validate: true } }],
      ["a validate next to ~standard", { "~standard": {}, validate: () => ({ value: 1 }) }],
    ])("should reject %s", (_name, value) => {
      expect(isStandardSchema(value)).toBe(false);
    });

    it("should not throw for hostile objects", () => {
      const throwing = new Proxy(
        {},
        {
          has: () => {
            throw new Error("has trap");
          },
        },
      );
      expect(() => isStandardSchema(Object.create(null))).not.toThrow();
      expect(isStandardSchema(Object.create(null))).toBe(false);
      expect(() => isStandardSchema(throwing)).toThrow("has trap");
    });

    it("should agree with TanStack AI for spec compliant values", () => {
      [z.string(), z.object({}), createSchema((value) => ({ value })), {}, null, undefined, 1, "x", []].forEach(
        (value) => {
          expect(isStandardSchema(value)).toBe(tanstackIsStandardSchema(value));
        },
      );
    });
  });

  describe("validateSchema", () => {
    it("should return the output value of a sync schema", async () => {
      const schema = createSchema<number>((value) => ({ value: Number(value) }));
      await expect(validateSchema(schema, "42")).resolves.toEqual({ success: true, value: 42 });
    });

    it("should return the output value of an async schema", async () => {
      const schema = createSchema<string>(async (value) => ({ value: `${String(value)}!` }));
      await expect(validateSchema(schema, "hi")).resolves.toEqual({ success: true, value: "hi!" });
    });

    it("should return the transformed output and not the input", async () => {
      const schema = z.object({ count: z.string().transform(Number), tags: z.array(z.string()).default([]) });
      await expect(validateSchema(schema, { count: "3" })).resolves.toEqual({
        success: true,
        value: { count: 3, tags: [] },
      });
    });

    it.each([undefined, null, 0, "", false, Number.NaN])("should pass the falsy output %j through", async (output) => {
      const schema = createSchema(() => ({ value: output }));
      const result = await validateSchema(schema, "input");
      expect(result.success).toBe(true);
      expect(result).toEqual({ success: true, value: output });
    });

    it("should treat an explicit issues: undefined as success", async () => {
      const schema = createSchema(() => ({ value: 1, issues: undefined }));
      await expect(validateSchema(schema, 1)).resolves.toEqual({ success: true, value: 1 });
    });

    it("should fail for sync and async issues", async () => {
      const sync = createSchema(() => ({ issues: [{ message: "sync issue" }] }));
      const asynchronous = createSchema(async () => ({ issues: [{ message: "async issue" }] }));
      const syncError = await issuesOf(sync, 1);
      const asyncError = await issuesOf(asynchronous, 1);
      expect(syncError.message).toBe("sync issue");
      expect(asyncError.message).toBe("async issue");
    });

    it("should fail for an empty issues array, like the spec says", async () => {
      // "If the `issues` field exists, the validation failed"
      const error = await issuesOf(
        createSchema(() => ({ issues: [] })),
        1,
      );
      expect(error.message).toBe("Validation failed");
      expect(error.issues).toEqual([]);
    });

    it("should keep the validated value and the original issues on the error", async () => {
      const issues = [{ message: "bad", path: ["a"] }];
      const value = { a: 1 };
      const error = await issuesOf(
        createSchema(() => ({ issues })),
        value,
      );
      expect(error).toBeInstanceOf(SchemaValidationError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("SchemaValidationError");
      expect(error.issues).toBe(issues);
      expect(error.value).toBe(value);
    });

    it("should prefix the message with the context", async () => {
      const schema = createSchema(() => ({ issues: [{ message: "bad" }] }));
      const withContext = await issuesOf(schema, 1, 'Tool "search" input');
      const withEmptyContext = await issuesOf(schema, 1, "");
      const withoutContext = await issuesOf(schema, 1);
      expect(withContext.message).toBe('Tool "search" input: bad');
      expect(withEmptyContext.message).toBe("bad");
      expect(withoutContext.message).toBe("bad");
    });

    it("should pass the value to validate untouched", async () => {
      const validate = vi.fn((value: unknown) => ({ value }));
      const input = { nested: [1] };
      await validateSchema(createSchema(validate), input);
      expect(validate).toHaveBeenCalledTimes(1);
      expect(validate.mock.calls[0][0]).toBe(input);
    });

    it("should reject when a sync schema throws", async () => {
      const schema = createSchema(() => {
        throw new TypeError("schema exploded");
      });
      await expect(validateSchema(schema, 1)).rejects.toThrow(TypeError);
      await expect(validateSchema(schema, 1)).rejects.toThrow("schema exploded");
    });

    it("should reject when an async schema rejects", async () => {
      const schema = createSchema(async () => {
        throw new Error("async schema exploded");
      });
      await expect(validateSchema(schema, 1)).rejects.toThrow("async schema exploded");
    });

    it("should never throw synchronously", () => {
      const schema = createSchema(() => {
        throw new Error("sync throw");
      });
      let promise: Promise<unknown> | undefined;
      expect(() => {
        promise = validateSchema(schema, 1);
      }).not.toThrow();
      return expect(promise).rejects.toThrow("sync throw");
    });

    it("should validate with Zod sync, async and nested schemas", async () => {
      const schema = z.object({
        user: z.object({ email: z.email(), age: z.number().min(18) }),
        tags: z.array(z.string()).max(2),
        slug: z.string().refine(async (value) => value === value.toLowerCase(), "must be lower case"),
      });
      await expect(
        validateSchema(schema, { user: { email: "a@b.co", age: 30 }, tags: ["x"], slug: "ok" }),
      ).resolves.toMatchObject({ success: true });

      const error = await issuesOf(schema, { user: { email: "nope", age: 3 }, tags: ["a", "b", "c"], slug: "NO" });
      expect(error.issues.map((issue) => issue.path?.join("."))).toEqual(["user.email", "user.age", "tags", "slug"]);
      expect(error.message).toContain("user.email: ");
      expect(error.message).toContain("slug: must be lower case");
    });
  });

  describe("SchemaValidationError message", () => {
    const messageOf = (issues: StandardSchemaV1.Issue[], context?: string) =>
      new SchemaValidationError(issues, undefined, context).message;

    it("should join plain key paths with dots", () => {
      expect(messageOf([{ message: "bad", path: ["a", "b", 0, "c"] }])).toBe("a.b.0.c: bad");
    });

    it("should read the key of path segment objects", () => {
      expect(messageOf([{ message: "bad", path: [{ key: "a" }, { key: 0 }, { key: "c" }] }])).toBe("a.0.c: bad");
    });

    it("should mix both path forms", () => {
      expect(messageOf([{ message: "bad", path: ["a", { key: 1 }, "b", { key: "c" }] }])).toBe("a.1.b.c: bad");
    });

    it("should print symbol keys", () => {
      expect(messageOf([{ message: "bad", path: [Symbol("id"), { key: Symbol.iterator }] }])).toBe(
        "Symbol(id).Symbol(Symbol.iterator): bad",
      );
    });

    it("should print only the message without a path", () => {
      expect(messageOf([{ message: "root" }])).toBe("root");
      expect(messageOf([{ message: "root", path: undefined }])).toBe("root");
      expect(messageOf([{ message: "root", path: [] }])).toBe("root");
    });

    it("should keep index 0 and empty looking keys", () => {
      expect(messageOf([{ message: "bad", path: [0] }])).toBe("0: bad");
      expect(messageOf([{ message: "bad", path: [0, 0] }])).toBe("0.0: bad");
    });

    it("should join several issues with semicolons", () => {
      expect(
        messageOf(
          [{ message: "first", path: ["a"] }, { message: "second" }, { message: "third", path: ["b", 1] }],
          "Ctx",
        ),
      ).toBe("Ctx: a: first; second; b.1: third");
    });

    it("should fall back to a generic message", () => {
      expect(messageOf([])).toBe("Validation failed");
      expect(messageOf([], "Ctx")).toBe("Ctx: Validation failed");
      expect(messageOf([{ message: "" }], "Ctx")).toBe("Ctx: Validation failed");
    });

    it("should not throw for a malformed path from a non compliant library", () => {
      const issues = [{ message: "bad", path: [null, undefined, "a"] }] as unknown as StandardSchemaV1.Issue[];
      expect(() => new SchemaValidationError(issues, 1)).not.toThrow();
      expect(new SchemaValidationError(issues, 1).message).toBe("null.undefined.a: bad");
    });

    it("should be throwable and catchable as an Error", () => {
      const error = new SchemaValidationError([{ message: "bad" }], { v: 1 });
      expect(() => {
        throw error;
      }).toThrow(SchemaValidationError);
      expect(error.stack).toContain("SchemaValidationError");
      expect(String(error)).toBe("SchemaValidationError: bad");
    });
  });

  describe("getJSONSchema", () => {
    it.each([
      ["string", z.string(), { type: "string" }],
      ["number", z.number(), { type: "number" }],
      ["integer", z.int(), { type: "integer" }],
      ["boolean", z.boolean(), { type: "boolean" }],
      ["null", z.null(), { type: "null" }],
      ["enum", z.enum(["a", "b"]), { type: "string", enum: ["a", "b"] }],
      ["literal", z.literal("x"), { type: "string", const: "x" }],
      ["array", z.array(z.number()), { type: "array", items: { type: "number" } }],
      ["union", z.union([z.string(), z.number()]), { anyOf: [{ type: "string" }, { type: "number" }] }],
      ["nullable", z.string().nullable(), { anyOf: [{ type: "string" }, { type: "null" }] }],
      ["record", z.record(z.string(), z.number()), { type: "object", additionalProperties: { type: "number" } }],
      ["described", z.string().describe("A name"), { type: "string", description: "A name" }],
      ["constrained string", z.string().min(1).max(5), { type: "string", minLength: 1, maxLength: 5 }],
    ])("should convert a Zod %s", (_name, schema, expected) => {
      expect(getJSONSchema(schema)).toMatchObject(expected);
    });

    it("should convert nested Zod objects with optional and default members", () => {
      const schema = z.object({
        query: z.string().describe("Search query"),
        limit: z.number().int().optional(),
        mode: z.enum(["fast", "deep"]).default("fast"),
        filters: z.object({ tags: z.array(z.string()) }).optional(),
      });
      expect(getJSONSchema(schema)).toMatchObject({
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          limit: { type: "integer" },
          mode: { type: "string", enum: ["fast", "deep"], default: "fast" },
          filters: { type: "object", properties: { tags: { type: "array", items: { type: "string" } } } },
        },
        required: ["query"],
      });
    });

    it("should describe the input side of a transforming schema", () => {
      const schema = z.object({ count: z.string().transform(Number) });
      expect(getJSONSchema(schema)).toMatchObject({ properties: { count: { type: "string" } } });
    });

    it("should request the draft 2020-12 target", () => {
      const input = vi.fn(() => ({ type: "object" }));
      getJSONSchema(createSchema((value) => ({ value }), { jsonSchema: { input } }));
      expect(input).toHaveBeenCalledTimes(1);
      expect(input).toHaveBeenCalledWith({ target: "draft-2020-12" });
      expect(getJSONSchema(z.string())).toMatchObject({ $schema: "https://json-schema.org/draft/2020-12/schema" });
    });

    it("should describe the same properties as TanStack AI does for a Zod schema", () => {
      const schema = z.object({ name: z.string(), age: z.number().int(), tags: z.array(z.object({ id: z.string() })) });
      const ours = getJSONSchema(schema) as Record<string, unknown>;
      const theirs = convertSchemaToJsonSchema(schema) as Record<string, unknown>;
      expect(ours.type).toBe(theirs.type);
      expect(ours.properties).toEqual(theirs.properties);
      expect(ours.required).toEqual(theirs.required);
    });

    it("should call the converter as a method of the jsonSchema object", () => {
      // A library may implement the converter as a class or an object using `this`
      class Converter {
        private readonly schema = { type: "object", properties: { q: { type: "string" } } };

        input() {
          return this.schema;
        }
      }
      const schema = createSchema((value) => ({ value }), { jsonSchema: new Converter() });
      expect(getJSONSchema(schema)).toEqual({ type: "object", properties: { q: { type: "string" } } });

      const literal = createSchema((value) => ({ value }), {
        jsonSchema: {
          stored: { type: "string" },
          input() {
            return (this as { stored: unknown }).stored;
          },
        },
      });
      expect(getJSONSchema(literal)).toEqual({ type: "string" });
    });

    it.each([
      ["date", z.date()],
      ["bigint", z.bigint()],
      ["map", z.map(z.string(), z.number())],
      ["set", z.set(z.string())],
      ["symbol", z.symbol()],
      ["custom", z.custom<string>(() => true)],
      ["undefined", z.undefined()],
      ["object with an unrepresentable member", z.object({ at: z.date() })],
    ])("should return undefined for a Zod %s, which has no JSON Schema", (_name, schema) => {
      expect(getJSONSchema(schema)).toBeUndefined();
    });

    it.each([
      ["undefined", undefined],
      ["null", null],
      ["a number", 1],
      ["a string", "schema"],
      ["an empty object", {}],
      ["a plain JSON Schema", { type: "object" }],
      ["~standard: null", { "~standard": null }],
      ["a schema without jsonSchema", createSchema((value) => ({ value }))],
      ["jsonSchema: null", createSchema((value) => ({ value }), { jsonSchema: null })],
      ["jsonSchema without input", createSchema((value) => ({ value }), { jsonSchema: { output: () => ({}) } })],
      ["an input that is not a function", createSchema((value) => ({ value }), { jsonSchema: { input: {} } })],
    ])("should return undefined for %s", (_name, schema) => {
      expect(getJSONSchema(schema)).toBeUndefined();
    });

    it("should return undefined when the converter throws", () => {
      const schema = createSchema((value) => ({ value }), {
        jsonSchema: {
          input: () => {
            throw new Error("target not supported");
          },
        },
      });
      expect(() => getJSONSchema(schema)).not.toThrow();
      expect(getJSONSchema(schema)).toBeUndefined();
    });

    it("should not call validate", () => {
      const validate = vi.fn((value: unknown) => ({ value }));
      getJSONSchema(createSchema(validate, { jsonSchema: { input: () => ({ type: "string" }) } }));
      expect(validate).not.toHaveBeenCalled();
    });
  });
});
