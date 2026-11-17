import type { JSONPatchOperationType } from "@hyper-fetch/ai";
import { applyJSONPatch, JSONPatchError } from "@hyper-fetch/ai";

import { deepFreeze } from "./fuzz.utils";

/** Operations as they arrive from the wire - not guaranteed to match the TypeScript type */
const wire = (operations: unknown[]) => operations as JSONPatchOperationType[];
const parse = (json: string): unknown => JSON.parse(json);

const expectPatchError = (document: unknown, operations: JSONPatchOperationType[], message: string) => {
  let thrown: unknown;
  try {
    applyJSONPatch(document, operations);
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toBeInstanceOf(JSONPatchError);
  expect((thrown as JSONPatchError).message).toContain(message);
  return thrown as JSONPatchError;
};

describe("applyJSONPatch - malformed input and prototype safety", () => {
  describe("malformed operations", () => {
    it("should reject an unknown op", () => {
      expectPatchError({ a: 1 }, wire([{ op: "merge", path: "/a", value: 1 }]), "Unknown operation");
      expectPatchError({ a: 1 }, wire([{ op: "ADD", path: "/a", value: 1 }]), "Unknown operation");
      expectPatchError({ a: 1 }, wire([{ path: "/a", value: 1 }]), "Unknown operation");
    });

    it.each(["add", "replace", "test"])("should reject %s without a value member", (op) => {
      // RFC 6902 4.1, 4.3, 4.6: the operation object MUST contain a "value" member
      expectPatchError({ a: 1 }, wire([{ op, path: "/a" }]), 'Missing "value"');
    });

    it("should not write undefined into the document when value is missing", () => {
      const document = { a: 1, list: [1] };
      expect(() => applyJSONPatch(document, wire([{ op: "add", path: "/b" }]))).toThrow(JSONPatchError);
      expect(() => applyJSONPatch(document, wire([{ op: "add", path: "/list/-" }]))).toThrow(JSONPatchError);
      expect(() => applyJSONPatch(document, wire([{ op: "replace", path: "" }]))).toThrow(JSONPatchError);
    });

    it("should accept an explicit null value", () => {
      expect(applyJSONPatch({ a: 1 }, [{ op: "replace", path: "/a", value: null }])).toEqual({ a: null });
      expect(applyJSONPatch({ a: null }, [{ op: "test", path: "/a", value: null }])).toEqual({ a: null });
    });

    it.each(["add", "remove", "replace", "move", "copy", "test"])(
      "should reject %s without a path with a JSONPatchError",
      (op) => {
        expectPatchError({ a: 1 }, wire([{ op, from: "/a", value: 1 }]), "Invalid JSON pointer");
      },
    );

    it.each(["move", "copy"])("should reject %s without from with a JSONPatchError", (op) => {
      expectPatchError({ a: 1 }, wire([{ op, path: "/b" }]), "Invalid JSON pointer");
    });

    it.each([null, 0, 1, true, ["a"], { a: 1 }])("should reject the non-string path %j", (path) => {
      expectPatchError({ a: 1 }, wire([{ op: "remove", path }]), "Invalid JSON pointer");
      expectPatchError({ a: 1 }, wire([{ op: "copy", from: path, path: "/b" }]), "Invalid JSON pointer");
    });

    it("should do nothing for an empty patch", () => {
      const document = { a: 1 };
      expect(applyJSONPatch(document, [])).toBe(document);
    });
  });

  describe("errors", () => {
    it("should expose the failing operation", () => {
      const operation: JSONPatchOperationType = { op: "replace", path: "/missing/deep", value: 1 };
      const error = expectPatchError({ a: 1 }, [{ op: "add", path: "/ok", value: 1 }, operation], "Path not found");
      expect(error.operation).toBe(operation);
      expect(error.name).toBe("JSONPatchError");
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Path not found (replace /missing/deep)");
    });

    it("should be atomic - a failing operation leaves no partial result behind", () => {
      const document = deepFreeze({ list: [1, 2], count: 0 });
      expect(() =>
        applyJSONPatch(document, [
          { op: "add", path: "/list/-", value: 3 },
          { op: "replace", path: "/count", value: 1 },
          { op: "remove", path: "/nope" },
        ]),
      ).toThrow(JSONPatchError);
      expect(document).toEqual({ list: [1, 2], count: 0 });
    });
  });

  describe("prototype pollution", () => {
    afterEach(() => {
      // Never leave a polluted prototype behind for other tests, even when an assertion fails
      delete (Object.prototype as Record<string, unknown>).polluted;
      delete (Array.prototype as unknown as Record<string, unknown>).polluted;
    });

    const expectCleanPrototypes = () => {
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
      expect(([] as unknown as Record<string, unknown>).polluted).toBeUndefined();
      expect(Object.hasOwn(Object.prototype, "polluted")).toBe(false);
    };

    it.each([
      "/__proto__/polluted",
      "/constructor/prototype/polluted",
      "/a/__proto__/polluted",
      "/a/constructor/prototype/polluted",
      "/list/__proto__/polluted",
      "/list/constructor/prototype/polluted",
      "/list/0/__proto__/polluted",
    ])("should not reach a prototype through %s", (path) => {
      const document = { a: {}, list: [{}] };
      expect(() => applyJSONPatch(document, [{ op: "add", path, value: true }])).toThrow(JSONPatchError);
      expect(() => applyJSONPatch(document, [{ op: "replace", path, value: true }])).toThrow(JSONPatchError);
      expect(() => applyJSONPatch(document, [{ op: "copy", from: "/a", path }])).toThrow(JSONPatchError);
      expect(() => applyJSONPatch(document, [{ op: "move", from: "/a", path }])).toThrow(JSONPatchError);
      expectCleanPrototypes();
    });

    it.each(["/__proto__", "/constructor", "/constructor/prototype", "/toString", "/hasOwnProperty", "/valueOf"])(
      "should not read the inherited member %s",
      (path) => {
        expect(() => applyJSONPatch({}, [{ op: "test", path, value: {} }])).toThrow(JSONPatchError);
        expect(() => applyJSONPatch({}, [{ op: "copy", from: path, path: "/copy" }])).toThrow(JSONPatchError);
        expect(() => applyJSONPatch({}, [{ op: "move", from: path, path: "/moved" }])).toThrow(JSONPatchError);
        expect(() => applyJSONPatch({}, [{ op: "remove", path }])).toThrow(JSONPatchError);
        expect(() => applyJSONPatch({}, [{ op: "replace", path, value: 1 }])).toThrow(JSONPatchError);
      },
    );

    it("should add __proto__ as a plain own member instead of replacing the prototype", () => {
      const result = applyJSONPatch<{ a: Record<string, unknown> }>({ a: {} }, [
        { op: "add", path: "/a/__proto__", value: { polluted: true } },
      ]);
      // The same document as JSON.parse('{"a":{"__proto__":{"polluted":true}}}') creates
      expect(Object.getPrototypeOf(result.a)).toBe(Object.prototype);
      expect(Object.hasOwn(result.a, "__proto__")).toBe(true);
      expect(result.a.polluted).toBeUndefined();
      expect("polluted" in result.a).toBe(false);
      expect(JSON.stringify(result)).toBe('{"a":{"__proto__":{"polluted":true}}}');
      expect(result).toEqual(parse('{"a":{"__proto__":{"polluted":true}}}'));
      expectCleanPrototypes();
    });

    it("should not drop a primitive added as __proto__", () => {
      const result = applyJSONPatch({}, [{ op: "add", path: "/__proto__", value: 5 }]);
      expect(JSON.stringify(result)).toBe('{"__proto__":5}');
      expect(applyJSONPatch(result, [{ op: "test", path: "/__proto__", value: 5 }])).toBe(result);
    });

    it("should add __proto__ at the document root of an existing object without changing its prototype", () => {
      const result = applyJSONPatch<Record<string, unknown>>({ keep: 1 }, [
        { op: "add", path: "/__proto__", value: null },
      ]);
      expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
      expect(Object.keys(result)).toEqual(["keep", "__proto__"]);
      expect(typeof result.toString).toBe("function");
    });

    it("should patch through an own __proto__ member", () => {
      const document = parse('{"__proto__":{"list":[1]},"other":1}');
      const result = applyJSONPatch(document, [
        { op: "add", path: "/__proto__/list/-", value: 2 },
        { op: "add", path: "/__proto__/flag", value: true },
        { op: "copy", from: "/__proto__", path: "/copied" },
        { op: "move", from: "/__proto__/flag", path: "/moved" },
      ]);
      expect(JSON.stringify(result)).toBe(
        '{"__proto__":{"list":[1,2]},"other":1,"copied":{"list":[1,2],"flag":true},"moved":true}',
      );
      expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
      expect(JSON.stringify(document)).toBe('{"__proto__":{"list":[1]},"other":1}');
      expectCleanPrototypes();
    });

    it("should remove and replace an own __proto__ member", () => {
      const document = parse('{"__proto__":{"a":1},"other":1}');
      expect(JSON.stringify(applyJSONPatch(document, [{ op: "remove", path: "/__proto__" }]))).toBe('{"other":1}');
      expect(JSON.stringify(applyJSONPatch(document, [{ op: "replace", path: "/__proto__", value: 2 }]))).toBe(
        '{"__proto__":2,"other":1}',
      );
      expect(JSON.stringify(applyJSONPatch(document, [{ op: "move", from: "/__proto__", path: "/moved" }]))).toBe(
        '{"other":1,"moved":{"a":1}}',
      );
    });

    it("should keep an own __proto__ member when a sibling changes", () => {
      const document = parse('{"__proto__":{"a":1},"other":1}');
      const result = applyJSONPatch(document, [{ op: "replace", path: "/other", value: 2 }]);
      expect(JSON.stringify(result)).toBe('{"__proto__":{"a":1},"other":2}');
      expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    });

    it("should use constructor and prototype as ordinary member names", () => {
      const result = applyJSONPatch({}, [
        { op: "add", path: "/constructor", value: { prototype: {} } },
        { op: "add", path: "/constructor/prototype/polluted", value: true },
        { op: "add", path: "/prototype", value: 1 },
        { op: "add", path: "/toString", value: "text" },
        { op: "add", path: "/hasOwnProperty", value: null },
      ]);
      expect(result).toEqual({
        constructor: { prototype: { polluted: true } },
        prototype: 1,
        toString: "text",
        hasOwnProperty: null,
      });
      expectCleanPrototypes();
    });

    it("should copy a value with an own __proto__ member without touching prototypes", () => {
      const document = parse('{"source":{"__proto__":{"polluted":true}}}');
      const result = applyJSONPatch<Record<string, Record<string, unknown>>>(document, [
        { op: "copy", from: "/source", path: "/target" },
      ]);
      expect(JSON.stringify(result.target)).toBe('{"__proto__":{"polluted":true}}');
      expect(result.target.polluted).toBeUndefined();
      expectCleanPrototypes();
    });
  });
});
