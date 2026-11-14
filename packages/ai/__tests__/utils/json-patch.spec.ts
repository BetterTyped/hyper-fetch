import { applyJSONPatch, JSONPatchError } from "@hyper-fetch/ai";

describe("applyJSONPatch", () => {
  const document = { user: { name: "Ann", tags: ["a", "b"] }, count: 1, "a/b": { "c~d": 1 } };

  it("should add, replace and remove values without mutating the input", () => {
    const snapshot = structuredClone(document);
    const result = applyJSONPatch(document, [
      { op: "add", path: "/user/age", value: 30 },
      { op: "replace", path: "/count", value: 2 },
      { op: "remove", path: "/user/tags/0" },
      { op: "add", path: "/user/tags/-", value: "z" },
      { op: "add", path: "/user/tags/0", value: "first" },
    ]);
    expect(result).toEqual({
      user: { name: "Ann", tags: ["first", "b", "z"], age: 30 },
      count: 2,
      "a/b": { "c~d": 1 },
    });
    expect(document).toEqual(snapshot);
  });

  it("should keep the identity of untouched branches", () => {
    const result = applyJSONPatch<typeof document>(document, [{ op: "replace", path: "/count", value: 5 }]);
    expect(result.user).toBe(document.user);
    expect(result).not.toBe(document);
  });

  it("should move, copy and test", () => {
    const result = applyJSONPatch(document, [
      { op: "copy", from: "/user/name", path: "/copied" },
      { op: "move", from: "/count", path: "/moved" },
      { op: "test", path: "/moved", value: 1 },
    ]);
    expect(result).toMatchObject({ copied: "Ann", moved: 1 });
    expect(result).not.toHaveProperty("count");
  });

  it("should unescape ~0 and ~1 in pointers", () => {
    expect(applyJSONPatch(document, [{ op: "replace", path: "/a~1b/c~0d", value: 2 }])).toMatchObject({
      "a/b": { "c~d": 2 },
    });
  });

  it("should replace the whole document with an empty path", () => {
    expect(applyJSONPatch(document, [{ op: "replace", path: "", value: { fresh: true } }])).toEqual({ fresh: true });
  });

  it.each([
    [{ op: "replace", path: "/missing", value: 1 }, "Path not found"],
    [{ op: "remove", path: "/user/missing" }, "Path not found"],
    [{ op: "add", path: "/user/tags/9", value: 1 }, "out of bounds"],
    [{ op: "replace", path: "/user/tags/x", value: 1 }, "Invalid array index"],
    [{ op: "test", path: "/count", value: 2 }, "Test failed"],
    [{ op: "add", path: "no-slash", value: 1 }, "Invalid JSON pointer"],
    [{ op: "remove", path: "" }, "Cannot remove the document root"],
  ] as const)("should throw for %j", (operation, message) => {
    expect(() => applyJSONPatch(document, [operation])).toThrow(JSONPatchError);
    expect(() => applyJSONPatch(document, [operation])).toThrow(message);
  });
});
