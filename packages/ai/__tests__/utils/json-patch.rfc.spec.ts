import type { JSONPatchOperationType } from "@hyper-fetch/ai";
import { applyJSONPatch, JSONPatchError } from "@hyper-fetch/ai";

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

describe("applyJSONPatch - RFC 6902", () => {
  describe("appendix A examples", () => {
    it("A.1 should add an object member", () => {
      expect(applyJSONPatch({ foo: "bar" }, [{ op: "add", path: "/baz", value: "qux" }])).toEqual({
        baz: "qux",
        foo: "bar",
      });
    });

    it("A.2 should add an array element", () => {
      expect(applyJSONPatch({ foo: ["bar", "baz"] }, [{ op: "add", path: "/foo/1", value: "qux" }])).toEqual({
        foo: ["bar", "qux", "baz"],
      });
    });

    it("A.3 should remove an object member", () => {
      expect(applyJSONPatch({ baz: "qux", foo: "bar" }, [{ op: "remove", path: "/baz" }])).toEqual({ foo: "bar" });
    });

    it("A.4 should remove an array element", () => {
      expect(applyJSONPatch({ foo: ["bar", "qux", "baz"] }, [{ op: "remove", path: "/foo/1" }])).toEqual({
        foo: ["bar", "baz"],
      });
    });

    it("A.5 should replace a value", () => {
      expect(applyJSONPatch({ baz: "qux", foo: "bar" }, [{ op: "replace", path: "/baz", value: "boo" }])).toEqual({
        baz: "boo",
        foo: "bar",
      });
    });

    it("A.6 should move a value", () => {
      const document = { foo: { bar: "baz", waldo: "fred" }, qux: { corge: "grault" } };
      expect(applyJSONPatch(document, [{ op: "move", from: "/foo/waldo", path: "/qux/thud" }])).toEqual({
        foo: { bar: "baz" },
        qux: { corge: "grault", thud: "fred" },
      });
    });

    it("A.7 should move an array element", () => {
      const document = { foo: ["all", "grass", "cows", "eat"] };
      expect(applyJSONPatch(document, [{ op: "move", from: "/foo/1", path: "/foo/3" }])).toEqual({
        foo: ["all", "cows", "eat", "grass"],
      });
    });

    it("A.8 should pass a successful test", () => {
      const document = { baz: "qux", foo: ["a", 2, "c"] };
      const result = applyJSONPatch(document, [
        { op: "test", path: "/baz", value: "qux" },
        { op: "test", path: "/foo/1", value: 2 },
      ]);
      expect(result).toBe(document);
    });

    it("A.9 should fail a test with a different value", () => {
      expectPatchError({ baz: "qux" }, [{ op: "test", path: "/baz", value: "bar" }], "Test failed");
    });

    it("A.10 should add a nested member object", () => {
      expect(applyJSONPatch({ foo: "bar" }, [{ op: "add", path: "/child", value: { grandchild: {} } }])).toEqual({
        foo: "bar",
        child: { grandchild: {} },
      });
    });

    it("A.11 should ignore unrecognized members of an operation", () => {
      expect(applyJSONPatch({ foo: "bar" }, wire([{ op: "add", path: "/baz", value: "qux", xyz: 123 }]))).toEqual({
        foo: "bar",
        baz: "qux",
      });
    });

    it("A.12 should fail to add to a nonexistent target", () => {
      expectPatchError({ foo: "bar" }, [{ op: "add", path: "/baz/bat", value: "qux" }], "Path not found");
    });

    it("A.14 should unescape ~01 as ~1 and not as /", () => {
      const document = { "/": 9, "~1": 10 };
      expect(applyJSONPatch(document, [{ op: "test", path: "/~01", value: 10 }])).toBe(document);
    });

    it("A.15 should not compare strings and numbers as equal", () => {
      expectPatchError({ "/": 9, "~1": 10 }, [{ op: "test", path: "/~01", value: "10" }], "Test failed");
    });

    it("A.16 should add an array as a single element", () => {
      expect(applyJSONPatch({ foo: ["bar"] }, [{ op: "add", path: "/foo/-", value: ["abc", "def"] }])).toEqual({
        foo: ["bar", ["abc", "def"]],
      });
    });
  });

  describe("RFC 6901 JSON pointers", () => {
    const document = {
      foo: ["bar", "baz"],
      "": 0,
      "a/b": 1,
      "c%d": 2,
      "e^f": 3,
      "g|h": 4,
      "i\\j": 5,
      'k"l': 6,
      " ": 7,
      "m~n": 8,
    };

    it.each([
      ["", document],
      ["/foo", ["bar", "baz"]],
      ["/foo/0", "bar"],
      ["/", 0],
      ["/a~1b", 1],
      ["/c%d", 2],
      ["/e^f", 3],
      ["/g|h", 4],
      [String.raw`/i\j`, 5],
      ['/k"l', 6],
      ["/ ", 7],
      ["/m~0n", 8],
    ])("should resolve the pointer %j", (path, value) => {
      expect(applyJSONPatch(document, [{ op: "test", path, value }])).toBe(document);
    });

    it.each(["foo", "a/b", " /foo", "#/foo", "~", "0"])(
      "should reject the pointer %j without a leading slash",
      (path) => {
        expectPatchError(document, [{ op: "test", path, value: 1 }], `Invalid JSON pointer "${path}"`);
        expectPatchError(document, [{ op: "copy", from: path, path: "/x" }], `Invalid JSON pointer "${path}"`);
      },
    );

    it("should treat every slash as a separator, including empty tokens", () => {
      const nested = { "": { "": { "": "deep" } }, a: { "": 1 } };
      expect(applyJSONPatch(nested, [{ op: "replace", path: "///", value: "set" }])).toEqual({
        "": { "": { "": "set" } },
        a: { "": 1 },
      });
      expect(applyJSONPatch(nested, [{ op: "remove", path: "/a/" }])).toEqual({ "": { "": { "": "deep" } }, a: {} });
    });

    it("should decode ~1 before ~0", () => {
      const tricky = { "~1": "tilde-one", "/": "slash", "~0": "tilde-zero", "~": "tilde", "~/": "both" };
      expect(
        applyJSONPatch(tricky, [
          { op: "test", path: "/~01", value: "tilde-one" },
          { op: "test", path: "/~1", value: "slash" },
          { op: "test", path: "/~00", value: "tilde-zero" },
          { op: "test", path: "/~0", value: "tilde" },
          { op: "test", path: "/~0~1", value: "both" },
        ]),
      ).toBe(tricky);
    });

    it("should not decode percent escapes or URI fragments", () => {
      const result = applyJSONPatch({ "a%2Fb": 1, "#": 2 }, [
        { op: "replace", path: "/a%2Fb", value: "x" },
        { op: "replace", path: "/#", value: "y" },
      ]);
      expect(result).toEqual({ "a%2Fb": "x", "#": "y" });
    });

    it("should use numeric looking tokens as plain keys for objects", () => {
      const result = applyJSONPatch({ 0: "a", "01": "b", "-": "c" }, [
        { op: "replace", path: "/0", value: 1 },
        { op: "replace", path: "/01", value: 2 },
        { op: "replace", path: "/-", value: 3 },
        { op: "add", path: "/1e3", value: 4 },
      ]);
      expect(result).toEqual({ 0: 1, "01": 2, "-": 3, "1e3": 4 });
    });

    it("should support unicode keys", () => {
      expect(applyJSONPatch({ "żółć 🚀": { 日本: 1 } }, [{ op: "replace", path: "/żółć 🚀/日本", value: 2 }])).toEqual({
        "żółć 🚀": { 日本: 2 },
      });
    });
  });

  describe("add", () => {
    it("should replace an existing object member", () => {
      expect(applyJSONPatch({ a: 1, b: 2 }, [{ op: "add", path: "/a", value: { n: 1 } }])).toEqual({
        a: { n: 1 },
        b: 2,
      });
    });

    it("should replace the whole document for the root path", () => {
      expect(applyJSONPatch({ a: 1 }, [{ op: "add", path: "", value: [1, 2] }])).toEqual([1, 2]);
      expect(applyJSONPatch([1], [{ op: "add", path: "", value: null }])).toBeNull();
      expect(applyJSONPatch(null, [{ op: "add", path: "", value: "text" }])).toBe("text");
      expect(applyJSONPatch(undefined, [{ op: "add", path: "", value: { a: 1 } }])).toEqual({ a: 1 });
    });

    it.each([
      ["/0", ["x", "a", "b", "c"]],
      ["/1", ["a", "x", "b", "c"]],
      ["/2", ["a", "b", "x", "c"]],
      ["/3", ["a", "b", "c", "x"]],
      ["/-", ["a", "b", "c", "x"]],
    ])("should insert into an array at %s", (path, expected) => {
      expect(applyJSONPatch(["a", "b", "c"], [{ op: "add", path, value: "x" }])).toEqual(expected);
    });

    it("should append to an empty array with index 0 and with -", () => {
      expect(applyJSONPatch([], [{ op: "add", path: "/0", value: 1 }])).toEqual([1]);
      expect(applyJSONPatch([], [{ op: "add", path: "/-", value: 1 }])).toEqual([1]);
    });

    it("should add into nested arrays and objects", () => {
      const document = { list: [{ tags: ["a"] }, { tags: [] }] };
      expect(
        applyJSONPatch(document, [
          { op: "add", path: "/list/0/tags/-", value: "b" },
          { op: "add", path: "/list/1/tags/0", value: "c" },
          { op: "add", path: "/list/1/extra", value: true },
          { op: "add", path: "/list/-", value: { tags: null } },
        ]),
      ).toEqual({ list: [{ tags: ["a", "b"] }, { tags: ["c"], extra: true }, { tags: null }] });
    });

    it.each([
      ["/4", "out of bounds"],
      ["/99", "out of bounds"],
      ["/99999999999999999999", "out of bounds"],
      ["/-1", "Invalid array index"],
      ["/01", "Invalid array index"],
      ["/00", "Invalid array index"],
      ["/1.0", "Invalid array index"],
      ["/1e0", "Invalid array index"],
      ["/+1", "Invalid array index"],
      ["/ 1", "Invalid array index"],
      ["/1 ", "Invalid array index"],
      ["/0x1", "Invalid array index"],
      ["/", "Invalid array index"],
      ["/x", "Invalid array index"],
      ["/length", "Invalid array index"],
      ["/--", "Invalid array index"],
      ["/１", "Invalid array index"],
    ])("should reject the array position %s", (path, message) => {
      expectPatchError(["a", "b", "c"], [{ op: "add", path, value: "x" }], message);
    });

    it("should not use - for an array that is not the last token", () => {
      expectPatchError({ a: [{ b: 1 }] }, [{ op: "add", path: "/a/-/b", value: 2 }], "Invalid array index");
    });

    it.each([
      [{ a: 1 }, "/a/b"],
      [{ a: "text" }, "/a/0"],
      [{ a: null }, "/a/b"],
      [{ a: true }, "/a/b"],
      [{}, "/missing/b"],
      [{ a: {} }, "/a/b/c"],
      [1, "/a"],
      ["text", "/0"],
      [null, "/a"],
      [undefined, "/a"],
    ])("should fail when the parent of %j %s is missing or not a container", (document, path) => {
      expectPatchError(document, [{ op: "add", path, value: 1 }], "Path not found");
    });

    it("should insert the given value itself, without cloning it", () => {
      const value = { nested: [1] };
      const result = applyJSONPatch<{ a: unknown }>({}, [{ op: "add", path: "/a", value }]);
      expect(result.a).toBe(value);
    });

    it("should accept every JSON value type", () => {
      expect(
        applyJSONPatch({}, [
          { op: "add", path: "/null", value: null },
          { op: "add", path: "/false", value: false },
          { op: "add", path: "/zero", value: 0 },
          { op: "add", path: "/empty", value: "" },
          { op: "add", path: "/array", value: [] },
          { op: "add", path: "/object", value: {} },
        ]),
      ).toEqual({ null: null, false: false, zero: 0, empty: "", array: [], object: {} });
    });
  });

  describe("remove", () => {
    it.each([
      ["/0", ["b", "c"]],
      ["/1", ["a", "c"]],
      ["/2", ["a", "b"]],
    ])("should remove the array element %s and shift the rest", (path, expected) => {
      expect(applyJSONPatch(["a", "b", "c"], [{ op: "remove", path }])).toEqual(expected);
    });

    it.each(["/3", "/-", "/x", "/01", "/-1"])("should reject removing the array element %s", (path) => {
      expect(() => applyJSONPatch(["a", "b", "c"], [{ op: "remove", path }])).toThrow(JSONPatchError);
    });

    it("should remove members holding null, false, 0 and empty values", () => {
      const document = { null: null, false: false, zero: 0, empty: "", keep: 1 };
      expect(
        applyJSONPatch(document, [
          { op: "remove", path: "/null" },
          { op: "remove", path: "/false" },
          { op: "remove", path: "/zero" },
          { op: "remove", path: "/empty" },
        ]),
      ).toEqual({ keep: 1 });
    });

    it("should fail for a missing member", () => {
      expectPatchError({ a: 1 }, [{ op: "remove", path: "/b" }], "Path not found");
      expectPatchError({ a: { b: 1 } }, [{ op: "remove", path: "/a/c" }], "Path not found");
      expectPatchError({ a: 1 }, [{ op: "remove", path: "/a/b" }], "Path not found");
    });

    it("should fail when removing the same member twice", () => {
      expectPatchError(
        { a: 1 },
        [
          { op: "remove", path: "/a" },
          { op: "remove", path: "/a" },
        ],
        "Path not found",
      );
    });

    it("should not treat inherited members as removable", () => {
      expectPatchError({}, [{ op: "remove", path: "/toString" }], "Path not found");
      expectPatchError({}, [{ op: "remove", path: "/constructor" }], "Path not found");
      expectPatchError({}, [{ op: "remove", path: "/__proto__" }], "Path not found");
    });

    it("should fail for the document root", () => {
      expectPatchError({ a: 1 }, [{ op: "remove", path: "" }], "Cannot remove the document root");
    });

    it("should empty an array one element at a time", () => {
      expect(
        applyJSONPatch(
          [1, 2, 3],
          [
            { op: "remove", path: "/0" },
            { op: "remove", path: "/0" },
            { op: "remove", path: "/0" },
          ],
        ),
      ).toEqual([]);
    });
  });

  describe("replace", () => {
    it("should replace object members and array elements", () => {
      expect(
        applyJSONPatch({ a: [1, 2, 3], b: { c: null } }, [
          { op: "replace", path: "/a/1", value: "two" },
          { op: "replace", path: "/b/c", value: [1] },
          { op: "replace", path: "/b", value: 0 },
        ]),
      ).toEqual({ a: [1, "two", 3], b: 0 });
    });

    it("should replace the whole document", () => {
      expect(applyJSONPatch({ a: 1 }, [{ op: "replace", path: "", value: null }])).toBeNull();
      expect(applyJSONPatch([1], [{ op: "replace", path: "", value: 0 }])).toBe(0);
    });

    it("should keep the position of a replaced object member", () => {
      const result = applyJSONPatch({ a: 1, b: 2, c: 3 }, [{ op: "replace", path: "/b", value: 9 }]);
      expect(Object.keys(result as object)).toEqual(["a", "b", "c"]);
    });

    it("should replace members holding falsy values", () => {
      expect(
        applyJSONPatch({ a: null, b: 0, c: "", d: false }, [
          { op: "replace", path: "/a", value: 1 },
          { op: "replace", path: "/b", value: 1 },
          { op: "replace", path: "/c", value: 1 },
          { op: "replace", path: "/d", value: 1 },
        ]),
      ).toEqual({ a: 1, b: 1, c: 1, d: 1 });
    });

    it.each([
      [{ a: 1 }, "/b"],
      [{ a: [1] }, "/a/1"],
      [{ a: [1] }, "/a/-"],
      [{ a: [] }, "/a/0"],
      [{}, "/toString"],
      [{ a: 1 }, "/a/b"],
    ])("should fail when the target %j %s does not exist", (document, path) => {
      expect(() => applyJSONPatch(document, [{ op: "replace", path, value: 1 }])).toThrow(JSONPatchError);
    });
  });

  describe("move", () => {
    it("should move between objects and arrays", () => {
      const document = { list: ["a", "b"], box: { item: { id: 1 } } };
      expect(
        applyJSONPatch(document, [
          { op: "move", from: "/box/item", path: "/list/1" },
          { op: "move", from: "/list/0", path: "/box/first" },
        ]),
      ).toEqual({ list: [{ id: 1 }, "b"], box: { first: "a" } });
    });

    it.each([
      ["/0", "/0", ["a", "b", "c", "d"]],
      ["/0", "/1", ["b", "a", "c", "d"]],
      ["/0", "/3", ["b", "c", "d", "a"]],
      ["/0", "/-", ["b", "c", "d", "a"]],
      ["/3", "/0", ["d", "a", "b", "c"]],
      ["/2", "/1", ["a", "c", "b", "d"]],
      ["/1", "/2", ["a", "c", "b", "d"]],
    ])("should move the array element %s to %s", (from, path, expected) => {
      expect(applyJSONPatch(["a", "b", "c", "d"], [{ op: "move", from, path }])).toEqual(expected);
    });

    it("should measure the target index after the removal", () => {
      // After removing an element the array has 3 elements, so 4 is past the end
      expectPatchError(["a", "b", "c", "d"], [{ op: "move", from: "/0", path: "/4" }], "out of bounds");
    });

    it("should overwrite an existing target member", () => {
      expect(applyJSONPatch({ a: 1, b: 2 }, [{ op: "move", from: "/a", path: "/b" }])).toEqual({ b: 1 });
    });

    it("should keep the document equal when from and path are the same", () => {
      expect(applyJSONPatch({ a: { b: 1 }, c: 2 }, [{ op: "move", from: "/a", path: "/a" }])).toEqual({
        a: { b: 1 },
        c: 2,
      });
      expect(applyJSONPatch([1, 2, 3], [{ op: "move", from: "/1", path: "/1" }])).toEqual([1, 2, 3]);
    });

    it("should move the value by reference", () => {
      const document = { a: { deep: [1] }, b: {} };
      const result = applyJSONPatch<{ b: { moved: unknown } }>(document, [
        { op: "move", from: "/a", path: "/b/moved" },
      ]);
      expect(result.b.moved).toBe(document.a);
    });

    it("should move a value to the document root", () => {
      expect(applyJSONPatch({ a: { b: [1] } }, [{ op: "move", from: "/a/b", path: "" }])).toEqual([1]);
    });

    it.each([
      [{ a: 1 }, "/missing", "/b"],
      [{ a: [1] }, "/a/1", "/b"],
      [{ a: [1] }, "/a/-", "/b"],
      [{ a: 1 }, "/a", "/missing/b"],
      [{ a: 1 }, "", "/b"],
    ])("should fail to move in %j from %j to %j", (document, from, path) => {
      expect(() => applyJSONPatch(document, [{ op: "move", from, path }])).toThrow(JSONPatchError);
    });

    it.each([
      [{ a: { b: 1 } }, "/a", "/a/c"],
      [{ a: { b: { c: 1 } } }, "/a", "/a/b/d"],
      [{ a: { b: { c: 1 } } }, "/a/b", "/a/b/c"],
      [{ a: 1 }, "", "/a"],
    ])("should not move a value into one of its own children (%j from %j to %j)", (document, from, path) => {
      expect(() => applyJSONPatch(document, [{ op: "move", from, path }])).toThrow(JSONPatchError);
    });

    it("should not move an array element into the element that takes its index", () => {
      // RFC 6902 4.4: "The from location MUST NOT be a proper prefix of the path location". Removing /0 first
      // shifts { b: 2 } to index 0, so a naive remove-then-add silently nests the value into its SIBLING.
      const document = [{ a: 1 }, { b: 2 }];
      expectPatchError(document, [{ op: "move", from: "/0", path: "/0/x" }], "into one of its children");
      expectPatchError({ list: [[1], [2], [3]] }, [{ op: "move", from: "/list/1", path: "/list/1/0" }], "children");
    });

    it("should allow moving to a location that only shares a string prefix", () => {
      expect(applyJSONPatch({ a: 1, ab: {} }, [{ op: "move", from: "/a", path: "/ab/c" }])).toEqual({ ab: { c: 1 } });
      expect(applyJSONPatch({ 1: "x", 10: {} }, [{ op: "move", from: "/1", path: "/10/y" }])).toEqual({
        10: { y: "x" },
      });
    });

    it("should allow moving a child to the place of its parent", () => {
      expect(applyJSONPatch({ a: { b: { c: 1 } } }, [{ op: "move", from: "/a/b", path: "/a" }])).toEqual({
        a: { c: 1 },
      });
    });
  });

  describe("copy", () => {
    it("should copy between objects and arrays", () => {
      const document = { list: ["a"], box: { item: { id: 1 } } };
      expect(
        applyJSONPatch(document, [
          { op: "copy", from: "/box/item", path: "/list/0" },
          { op: "copy", from: "/list/1", path: "/box/first" },
          { op: "copy", from: "/list", path: "/list/-" },
        ]),
      ).toEqual({ list: [{ id: 1 }, "a", [{ id: 1 }, "a"]], box: { item: { id: 1 }, first: "a" } });
    });

    it("should create a deep copy that is independent from the source", () => {
      const document = { source: { deep: { list: [1, { x: 1 }] } } };
      const result = applyJSONPatch<{ source: typeof document.source; target: typeof document.source }>(document, [
        { op: "copy", from: "/source", path: "/target" },
      ]);
      expect(result.target).toEqual(document.source);
      expect(result.target).not.toBe(result.source);
      expect(result.target.deep).not.toBe(result.source.deep);
      expect(result.target.deep.list[1]).not.toBe(result.source.deep.list[1]);
      expect(result.source).toBe(document.source);
    });

    it("should copy a value into one of its own children", () => {
      expect(applyJSONPatch({ a: { b: 1 } }, [{ op: "copy", from: "/a", path: "/a/c" }])).toEqual({
        a: { b: 1, c: { b: 1 } },
      });
    });

    it("should copy the whole document into itself", () => {
      expect(applyJSONPatch({ a: 1 }, [{ op: "copy", from: "", path: "/self" }])).toEqual({ a: 1, self: { a: 1 } });
    });

    it("should overwrite an existing target member", () => {
      expect(applyJSONPatch({ a: 1, b: 2 }, [{ op: "copy", from: "/a", path: "/b" }])).toEqual({ a: 1, b: 1 });
    });

    it("should copy primitives and null", () => {
      expect(
        applyJSONPatch({ n: null, f: false, z: 0 }, [
          { op: "copy", from: "/n", path: "/n2" },
          { op: "copy", from: "/f", path: "/f2" },
          { op: "copy", from: "/z", path: "/z2" },
        ]),
      ).toEqual({ n: null, f: false, z: 0, n2: null, f2: false, z2: 0 });
    });

    it.each([
      ["/missing", "/b"],
      ["/list/5", "/b"],
      ["/list/-", "/b"],
      ["/a", "/missing/b"],
      ["/a", "/list/9"],
    ])("should fail to copy from %j to %j", (from, path) => {
      expect(() => applyJSONPatch({ a: 1, list: [1] }, [{ op: "copy", from, path }])).toThrow(JSONPatchError);
    });
  });

  describe("test", () => {
    it.each([
      [null, null],
      [true, true],
      [false, false],
      [0, 0],
      [0, -0],
      [1.5, 1.5],
      [1e3, 1000],
      ["", ""],
      ["żółć", "żółć"],
      [[], []],
      [{}, {}],
      [
        [1, [2, [3]]],
        [1, [2, [3]]],
      ],
      [
        { a: 1, b: { c: [null] } },
        { b: { c: [null] }, a: 1 },
      ],
    ])("should treat %j and %j as equal", (current, value) => {
      const document = { target: current };
      expect(applyJSONPatch(document, [{ op: "test", path: "/target", value }])).toBe(document);
    });

    it.each([
      [null, false],
      [null, 0],
      [null, ""],
      [null, {}],
      [null, []],
      [0, false],
      [0, ""],
      [0, "0"],
      [1, true],
      [1, "1"],
      ["", false],
      ["a", "A"],
      [[], {}],
      [{}, []],
      [
        [1, 2],
        [2, 1],
      ],
      [[1], [1, 1]],
      [[1, 1], [1]],
      [[[]], [[], []]],
      [{ a: 1 }, { a: 2 }],
      [{ a: 1 }, { b: 1 }],
      [{ a: 1 }, { a: 1, b: 2 }],
      [{ a: 1, b: 2 }, { a: 1 }],
      [{ a: null }, {}],
      [{}, { a: null }],
      [{ a: [] }, { a: {} }],
      [{ 0: "a", 1: "b" }, ["a", "b"]],
    ])("should treat %j and %j as different", (current, value) => {
      expectPatchError({ target: current }, [{ op: "test", path: "/target", value }], "Test failed");
    });

    it("should test the whole document", () => {
      const document = { a: [1, { b: 2 }] };
      expect(applyJSONPatch(document, [{ op: "test", path: "", value: { a: [1, { b: 2 }] } }])).toBe(document);
      expectPatchError(document, [{ op: "test", path: "", value: { a: [1, { b: 3 }] } }], "Test failed");
    });

    it("should fail for a missing location instead of comparing with undefined", () => {
      expectPatchError({ a: 1 }, [{ op: "test", path: "/b", value: null }], "Path not found");
      expectPatchError({ a: [1] }, [{ op: "test", path: "/a/1", value: null }], "out of bounds");
      expectPatchError({ a: [1] }, [{ op: "test", path: "/a/-", value: null }], "Invalid array index");
    });

    it("should not match members inherited from Object.prototype", () => {
      // "x" is not a member of the document value - its only member is "__proto__"
      const document = parse('{"target":{"__proto__":{}}}');
      expectPatchError(document, [{ op: "test", path: "/target", value: { x: 1 } }], "Test failed");
      expectPatchError(document, [{ op: "test", path: "/target", value: {} }], "Test failed");
      expectPatchError(
        { target: {} },
        [{ op: "test", path: "/target", value: parse('{"__proto__":{}}') }],
        "Test failed",
      );
    });

    it("should compare own __proto__ members like any other member", () => {
      const document = parse('{"target":{"__proto__":{"a":1}}}');
      expect(applyJSONPatch(document, [{ op: "test", path: "/target", value: parse('{"__proto__":{"a":1}}') }])).toBe(
        document,
      );
      expectPatchError(
        document,
        [{ op: "test", path: "/target", value: parse('{"__proto__":{"a":2}}') }],
        "Test failed",
      );
    });

    it("should stop the patch at the first failing test", () => {
      const document = { a: 1 };
      expectPatchError(
        document,
        [
          { op: "replace", path: "/a", value: 2 },
          { op: "test", path: "/a", value: 1 },
          { op: "replace", path: "/a", value: 3 },
        ],
        "Test failed",
      );
      expect(document).toEqual({ a: 1 });
    });

    it("should see the changes of earlier operations", () => {
      expect(
        applyJSONPatch({ a: 1 }, [
          { op: "replace", path: "/a", value: 2 },
          { op: "test", path: "/a", value: 2 },
          { op: "add", path: "/b", value: [] },
          { op: "test", path: "/b", value: [] },
        ]),
      ).toEqual({ a: 2, b: [] });
    });
  });
});
