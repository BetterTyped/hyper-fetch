import { isPlainObject, replaceEqualDeep } from "cache";

class Model {
  value = 1;
}

describe("replaceEqualDeep [ Utils ]", () => {
  describe("When values are equal", () => {
    it("should return previous reference for deeply equal objects", () => {
      const prev = { a: 1, b: { c: [1, 2, { d: "x" }] } };
      const next = { a: 1, b: { c: [1, 2, { d: "x" }] } };

      expect(replaceEqualDeep(prev, next)).toBe(prev);
    });

    it("should return previous reference for deeply equal arrays", () => {
      const prev = [{ id: 1 }, { id: 2 }];
      const next = [{ id: 1 }, { id: 2 }];

      expect(replaceEqualDeep(prev, next)).toBe(prev);
    });

    it("should handle primitives and NaN", () => {
      expect(replaceEqualDeep(1, 1)).toBe(1);
      expect(replaceEqualDeep("a", "b")).toBe("b");
      expect(replaceEqualDeep(NaN, NaN)).toBeNaN();
      expect(replaceEqualDeep(null, { a: 1 })).toStrictEqual({ a: 1 });
      expect(replaceEqualDeep({ a: 1 }, null)).toBeNull();
    });

    it("should treat empty containers as equal", () => {
      const prevObject = {};
      const prevArray: unknown[] = [];

      expect(replaceEqualDeep(prevObject, {})).toBe(prevObject);
      expect(replaceEqualDeep(prevArray, [])).toBe(prevArray);
    });
  });

  describe("When values differ", () => {
    it("should reuse unchanged branches of objects", () => {
      const prev = { unchanged: { deep: [1, 2] }, changed: { value: 1 } };
      const next = { unchanged: { deep: [1, 2] }, changed: { value: 2 } };

      const result = replaceEqualDeep(prev, next);

      expect(result).not.toBe(prev);
      expect(result).toStrictEqual(next);
      expect(result.unchanged).toBe(prev.unchanged);
      expect(result.changed).not.toBe(prev.changed);
    });

    it("should reuse unchanged array items", () => {
      const prev = [{ id: 1 }, { id: 2 }];
      const next = [{ id: 1 }, { id: 3 }, { id: 4 }];

      const result = replaceEqualDeep(prev, next);

      expect(result).toStrictEqual(next);
      expect(result[0]).toBe(prev[0]);
      expect(result[1]).not.toBe(prev[1]);
    });

    it("should detect removed array items and object keys", () => {
      const prevArray = [1, 2, 3];
      const prevObject = { a: 1, b: 2 };

      expect(replaceEqualDeep(prevArray, [1, 2])).toStrictEqual([1, 2]);
      expect(replaceEqualDeep(prevArray, [1, 2])).not.toBe(prevArray);
      expect(replaceEqualDeep(prevObject, { a: 1 })).toStrictEqual({ a: 1 });
      expect(replaceEqualDeep(prevObject, { a: 1 })).not.toBe(prevObject);
    });

    it("should not treat a missing key as equal to an undefined value", () => {
      const prev: Record<string, unknown> = { a: 1, b: 2 };
      const next: Record<string, unknown> = { a: 1, c: undefined };

      const result = replaceEqualDeep(prev, next);

      expect(result).not.toBe(prev);
      expect(Object.keys(result)).toStrictEqual(["a", "c"]);
    });

    it("should not mix arrays with objects", () => {
      const prev = { 0: "a" };
      const next = ["a"];

      expect(replaceEqualDeep(prev, next)).toBe(next);
    });

    it("should replace non plain objects", () => {
      const prevDate = new Date(1000);
      const nextDate = new Date(1000);
      const nextModel = new Model();
      const nextMap = new Map([["a", 1]]);

      expect(replaceEqualDeep(prevDate, nextDate)).toBe(nextDate);
      expect(replaceEqualDeep(new Model(), nextModel)).toBe(nextModel);
      expect(replaceEqualDeep(new Map([["a", 1]]), nextMap)).toBe(nextMap);
    });

    it("should keep shared references inside non plain parents", () => {
      const shared = { a: 1 };
      const prev = { list: [shared], date: new Date(1) };
      const next = { list: [{ a: 1 }], date: new Date(1) };

      const result = replaceEqualDeep(prev, next);

      expect(result).not.toBe(prev);
      expect(result.list).toBe(prev.list);
      expect(result.date).toBe(next.date);
    });
  });

  describe("When checking plain objects", () => {
    it("should recognize plain objects only", () => {
      expect(isPlainObject({})).toBeTrue();
      expect(isPlainObject(Object.create(null))).toBeTrue();
      expect(isPlainObject([])).toBeFalse();
      expect(isPlainObject(new Date())).toBeFalse();
      expect(isPlainObject(null)).toBeFalse();
      expect(isPlainObject(new Model())).toBeFalse();
    });
  });
});
