import { isPlainObject, replaceEqualDeep } from "cache";
import { Client } from "client";

import { createCacheErrorResponse, createCacheResponse } from "../../utils/fixtures.utils";

type Nested = { child?: Nested; value?: number };

class Model {
  constructor(public id: number) {}
}

const createNested = (depth: number): Nested => {
  const root: Nested = {};
  let current = root;
  for (let i = 0; i < depth; i += 1) {
    current.child = {};
    current = current.child;
  }
  current.value = 1;
  return root;
};

const getDepth = (value: Nested): number => {
  let depth = 0;
  let current: Nested | undefined = value;
  while (current?.child) {
    depth += 1;
    current = current.child;
  }
  return depth;
};

describe("Cache [ Structural Sharing ]", () => {
  describe("When comparing primitives", () => {
    it.each([
      { name: "numbers", prev: 1, next: 1 },
      { name: "strings", prev: "value", next: "value" },
      { name: "booleans", prev: false, next: false },
      { name: "null", prev: null, next: null },
      { name: "undefined", prev: undefined, next: undefined },
      { name: "NaN", prev: NaN, next: NaN },
    ])("should return the previous value for equal $name", ({ prev, next }) => {
      expect(replaceEqualDeep(prev, next)).toBe(prev);
    });

    it.each([
      { name: "a different value", prev: 1, next: 2 },
      { name: "a different type", prev: 1, next: "1" },
      { name: "null instead of undefined", prev: undefined, next: null },
      { name: "undefined instead of null", prev: null, next: undefined },
      { name: "false instead of zero", prev: 0, next: false },
      { name: "an empty string instead of zero", prev: 0, next: "" },
    ])("should return the next value for $name", ({ prev, next }) => {
      expect(replaceEqualDeep(prev, next)).toBe(next);
    });

    it("should tell the negative zero from the positive zero", () => {
      expect(Object.is(replaceEqualDeep(0, -0), -0)).toBeTrue();
      expect(Object.is(replaceEqualDeep(-0, 0), 0)).toBeTrue();
    });

    it("should tell the nested negative zero from the positive zero", () => {
      const prev = { value: 0, list: [0] };

      const result = replaceEqualDeep(prev, { value: -0, list: [-0] });

      expect(result).not.toBe(prev);
      expect(Object.is(result.value, -0)).toBeTrue();
      expect(Object.is(result.list[0], -0)).toBeTrue();
    });

    it("should share the values which contain NaN", () => {
      const prev = { value: NaN, list: [NaN, { nested: NaN }] };
      const next = { value: NaN, list: [NaN, { nested: NaN }] };

      expect(replaceEqualDeep(prev, next)).toBe(prev);
    });

    it("should return the next value when a primitive replaces an object and the other way round", () => {
      const object = { id: 1 };

      expect(replaceEqualDeep(object, 1)).toBe(1);
      expect(replaceEqualDeep(1, object)).toBe(object);
      expect(replaceEqualDeep(object, null)).toBeNull();
      expect(replaceEqualDeep(null, object)).toBe(object);
    });
  });

  describe("When comparing objects", () => {
    it("should return the previous object when the keys come in a different order", () => {
      const prev = { id: 1, name: "Kate", tags: ["admin"] };
      const next = { tags: ["admin"], name: "Kate", id: 1 };

      expect(replaceEqualDeep(prev, next)).toBe(prev);
    });

    it("should replace every parent of the changed value and keep the other branches", () => {
      const prev = { user: { profile: { name: "Kate" }, settings: { theme: "dark" } }, posts: [{ id: 1 }] };
      const next = { user: { profile: { name: "Maya" }, settings: { theme: "dark" } }, posts: [{ id: 1 }] };

      const result = replaceEqualDeep(prev, next);

      expect(result).toStrictEqual(next);
      expect(result).not.toBe(prev);
      expect(result.user).not.toBe(prev.user);
      expect(result.user.profile).not.toBe(prev.user.profile);
      expect(result.user.settings).toBe(prev.user.settings);
      expect(result.posts).toBe(prev.posts);
    });

    it("should detect the added key", () => {
      const prev = { id: 1 };
      const next = { id: 1, name: "Kate" };

      const result = replaceEqualDeep(prev, next);

      expect(result).not.toBe(prev);
      expect(result).toStrictEqual(next);
    });

    it("should detect the removed key", () => {
      const prev = { id: 1, name: "Kate" };
      const next = { id: 1 };

      const result = replaceEqualDeep(prev, next);

      expect(result).not.toBe(prev);
      expect(result).toStrictEqual(next);
    });

    it("should detect the renamed key with the same value", () => {
      const prev = { first: 1 };
      const next = { second: 1 };

      expect(replaceEqualDeep(prev, next)).toStrictEqual({ second: 1 });
    });

    it("should handle the same number of keys when one of them holds undefined", () => {
      const prev = { a: 1, b: undefined };
      const next = { a: 1, c: undefined };

      const result = replaceEqualDeep<Record<string, unknown>>(prev, next);

      expect(result).not.toBe(prev);
      expect(Object.keys(result)).toStrictEqual(["a", "c"]);
    });

    it("should share the values which contain undefined", () => {
      const prev = { a: { b: undefined }, c: undefined };
      const next = { a: { b: undefined }, c: undefined };

      expect(replaceEqualDeep(prev, next)).toBe(prev);
    });

    it("should treat objects without the prototype like plain objects", () => {
      const prev = Object.assign(Object.create(null), { nested: { id: 1 } });
      const next = Object.assign(Object.create(null), { nested: { id: 1 } });

      expect(replaceEqualDeep(prev, next)).toBe(prev);
      expect(replaceEqualDeep(prev, { nested: { id: 1 } })).toBe(prev);
    });

    it("should share the objects with own constructor property", () => {
      const prev = { constructor: "value", id: 1 };
      const next = { constructor: "value", id: 1 };

      expect(replaceEqualDeep(prev, next)).toBe(prev);
    });

    it("should not change the compared values", () => {
      const prev = Object.freeze({ list: Object.freeze([Object.freeze({ id: 1 })]), name: "Kate" });
      const next = Object.freeze({ list: Object.freeze([Object.freeze({ id: 1 })]), name: "Maya" });

      const result = replaceEqualDeep(prev, next);

      expect(result).toStrictEqual({ list: [{ id: 1 }], name: "Maya" });
      expect(result.list).toBe(prev.list);
    });

    it("should share the same object placed twice in the next value", () => {
      const shared = { id: 1 };
      const prev = { first: { id: 1 }, second: { id: 1 } };
      const next = { first: shared, second: shared };

      expect(replaceEqualDeep(prev, next)).toBe(prev);
    });
  });

  describe("When comparing arrays", () => {
    it("should keep the references of the unchanged items", () => {
      const prev = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const next = [{ id: 1 }, { id: 20 }, { id: 3 }];

      const result = replaceEqualDeep(prev, next);

      expect(result).not.toBe(prev);
      expect(result).toStrictEqual(next);
      expect(result[0]).toBe(prev[0]);
      expect(result[1]).not.toBe(prev[1]);
      expect(result[2]).toBe(prev[2]);
    });

    it("should return a copy when the next array is longer", () => {
      const prev = [{ id: 1 }];
      const next = [{ id: 1 }, { id: 2 }];

      const result = replaceEqualDeep(prev, next);

      expect(result).toStrictEqual(next);
      expect(result).not.toBe(prev);
      expect(result[0]).toBe(prev[0]);
    });

    it("should return a copy when the next array is shorter", () => {
      const prev = [{ id: 1 }, { id: 2 }];
      const next = [{ id: 1 }];

      const result = replaceEqualDeep(prev, next);

      expect(result).toStrictEqual(next);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(prev[0]);
    });

    it("should compare the items by their position", () => {
      const prev = [{ id: 1 }, { id: 2 }];
      const next = [{ id: 2 }, { id: 1 }];

      const result = replaceEqualDeep(prev, next);

      expect(result).toStrictEqual(next);
      expect(result[0]).not.toBe(prev[1]);
    });

    it("should return the previous array of undefined values", () => {
      const prev = [undefined, undefined];
      const next = [undefined, undefined];

      expect(replaceEqualDeep(prev, next)).toBe(prev);
    });

    it("should return the previous array which contains undefined", () => {
      const prev = [1, undefined, { id: 1 }];
      const next = [1, undefined, { id: 1 }];

      expect(replaceEqualDeep(prev, next)).toBe(prev);
    });

    it("should return the result as an array", () => {
      const result = replaceEqualDeep([{ id: 1 }], [{ id: 1 }, { id: 2 }]);

      expect(Array.isArray(result)).toBeTrue();
    });

    it("should not share the sparse arrays", () => {
      // eslint-disable-next-line no-sparse-arrays
      const prev = [1, , 3];
      // eslint-disable-next-line no-sparse-arrays
      const next = [1, , 3];

      expect(replaceEqualDeep(prev, next)).toBe(next);
    });

    it("should not share the arrays with additional properties", () => {
      const prev = Object.assign([1, 2], { total: 2 });
      const next = Object.assign([1, 2], { total: 2 });

      expect(replaceEqualDeep(prev, next)).toBe(next);
    });

    it("should not treat the array-like objects as arrays", () => {
      const prev = [1, 2];
      const next = { 0: 1, 1: 2 };

      expect(replaceEqualDeep<unknown>(prev, next)).toBe(next);
    });
  });

  describe("When comparing values which are not plain objects", () => {
    it.each([
      { name: "dates", create: () => new Date("2026-01-01T00:00:00.000Z") },
      { name: "maps", create: () => new Map([["key", 1]]) },
      { name: "sets", create: () => new Set([1]) },
      { name: "expressions", create: () => /value/ },
      { name: "class instances", create: () => new Model(1) },
      { name: "typed arrays", create: () => new Uint8Array([1, 2]) },
      { name: "errors", create: () => new Error("Failed") },
      { name: "functions", create: () => () => 1 },
    ])("should take the equal $name from the next value", ({ create }) => {
      const prev = create();
      const next = create();

      expect(replaceEqualDeep<unknown>(prev, next)).toBe(next);
    });

    it("should keep the same instance when it did not change", () => {
      const date = new Date();
      const model = new Model(1);
      const prev = { date, model, nested: { id: 1 } };
      const next = { date, model, nested: { id: 1 } };

      expect(replaceEqualDeep(prev, next)).toBe(prev);
    });

    it("should replace the parent of the instance which changed and keep its plain siblings", () => {
      const prev = { createdAt: new Date(1), author: { name: "Kate" } };
      const next = { createdAt: new Date(1), author: { name: "Kate" } };

      const result = replaceEqualDeep(prev, next);

      expect(result).not.toBe(prev);
      expect(result.createdAt).toBe(next.createdAt);
      expect(result.author).toBe(prev.author);
    });

    it("should not look inside of the class instances", () => {
      const prev = { model: Object.assign(new Model(1), { nested: { id: 1 } }) };
      const next = { model: Object.assign(new Model(1), { nested: { id: 1 } }) };

      const result = replaceEqualDeep(prev, next);

      expect(result.model).toBe(next.model);
      expect(result.model.nested).toBe(next.model.nested);
    });
  });

  describe("When comparing circular and deep structures", () => {
    it("should not overflow the stack for the circular structures", () => {
      const prev: Record<string, unknown> = { id: 1 };
      prev.self = prev;
      const next: Record<string, unknown> = { id: 1 };
      next.self = next;

      const result = replaceEqualDeep(prev, next);

      expect(result.id).toBe(1);
      expect(result.self).toBe(next);
    });

    it("should handle the structures which reference each other", () => {
      const createPair = () => {
        const parent: Record<string, unknown> = { name: "parent" };
        const child: Record<string, unknown> = { name: "child", parent };
        parent.child = child;
        return parent;
      };

      const result = replaceEqualDeep(createPair(), createPair());

      expect(result.name).toBe("parent");
      expect((result.child as Record<string, unknown>).name).toBe("child");
    });

    it("should handle the circular arrays", () => {
      const prev: unknown[] = [1];
      prev.push(prev);
      const next: unknown[] = [1];
      next.push(next);

      const result = replaceEqualDeep(prev, next);

      expect(result[0]).toBe(1);
      expect(result[1]).toBe(next);
    });

    it("should handle many circular references in a single structure", () => {
      const createGraph = () => {
        const node: Record<string, unknown> = { id: 1 };
        for (let i = 0; i < 30; i += 1) {
          node[`link${i}`] = node;
        }
        return node;
      };

      const result = replaceEqualDeep(createGraph(), createGraph());

      expect(Object.keys(result)).toHaveLength(31);
    });

    it("should handle the circular next value compared with the plain previous value", () => {
      const prev = { id: 1, self: { id: 1, self: { id: 1 } } };
      const next: Record<string, unknown> = { id: 1 };
      next.self = next;

      const result = replaceEqualDeep<Record<string, unknown>>(prev, next);

      expect(result.id).toBe(1);
      expect(result.self).toBe(next);
    });

    it("should keep the unchanged branches next to the circular reference", () => {
      const prev: Record<string, unknown> = { list: [{ id: 1 }] };
      prev.self = prev;
      const next: Record<string, unknown> = { list: [{ id: 1 }] };
      next.self = next;

      const result = replaceEqualDeep(prev, next);

      expect(result.list).toBe(prev.list);
    });

    it("should not overflow the stack for the extremely deep structures", () => {
      const depth = 20_000;
      const prev = createNested(depth);
      const next = createNested(depth);

      const result = replaceEqualDeep(prev, next);

      expect(getDepth(result)).toBe(depth);
    });

    it("should share the deep structures which fit in the depth limit", () => {
      const prev = createNested(400);
      const next = createNested(400);

      expect(replaceEqualDeep(prev, next)).toBe(prev);
    });
  });

  describe("When checking plain objects", () => {
    it.each([
      { name: "object literal", value: {} },
      { name: "object without the prototype", value: Object.create(null) },
      { name: "object with own constructor property", value: { constructor: null } },
    ])("should recognize the $name", ({ value }) => {
      expect(isPlainObject(value)).toBeTrue();
    });

    it.each([
      { name: "null", value: null },
      { name: "undefined", value: undefined },
      { name: "array", value: [] },
      { name: "string", value: "value" },
      { name: "number", value: 1 },
      { name: "function", value: () => {} },
      { name: "date", value: new Date() },
      { name: "map", value: new Map() },
      { name: "set", value: new Set() },
      { name: "expression", value: /value/ },
      { name: "error", value: new Error("Failed") },
      { name: "promise", value: Promise.resolve() },
      { name: "class instance", value: new Model(1) },
      { name: "object with a custom prototype", value: Object.create({ inherited: true }) },
      { name: "object with a custom string tag", value: { [Symbol.toStringTag]: "Custom" } },
    ])("should reject the $name", ({ value }) => {
      expect(isPlainObject(value)).toBeFalse();
    });
  });

  describe("When the cache shares the data", () => {
    let client = new Client({ url: "shared-base-url" });
    let request = client.createRequest<{ response: any; error: { message: string } }>()({ endpoint: "/users" });

    beforeEach(() => {
      client = new Client({ url: "shared-base-url" });
      request = client.createRequest<{ response: any; error: { message: string } }>()({ endpoint: "/users" });
    });

    afterEach(() => {
      client.cache.clear();
    });

    it("should keep the data reference when the same response arrives again", () => {
      client.cache.set(request, createCacheResponse({ users: [{ id: 1 }], total: 1 }));
      const first = request.read()?.data;

      client.cache.set(request, createCacheResponse({ users: [{ id: 1 }], total: 1 }));

      expect(request.read()?.data).toBe(first);
    });

    it("should emit the shared data to the listeners", () => {
      const spy = vi.fn();
      client.cache.set(request, createCacheResponse({ users: [{ id: 1 }] }));
      const first = request.read()?.data;
      client.cache.events.onDataByKey(request.cacheKey, spy);

      client.cache.set(request, createCacheResponse({ users: [{ id: 1 }] }));

      expect(spy.mock.calls[0][0].data).toBe(first);
    });

    it("should update the timestamps even when the data is shared", () => {
      const responseTimestamp = Date.now();
      client.cache.set(request, createCacheResponse({ id: 1 }, { responseTimestamp: responseTimestamp - 1000 }));
      const first = client.cache.get(request.cacheKey);

      client.cache.set(request, createCacheResponse({ id: 1 }, { responseTimestamp }));

      expect(client.cache.get(request.cacheKey)?.responseTimestamp).toBe(responseTimestamp);
      expect(request.read()?.data).toBe(first?.data);
    });

    it("should keep the unchanged items of the list", () => {
      client.cache.set(request, createCacheResponse([{ id: 1 }, { id: 2 }]));
      const first = request.read()?.data;

      client.cache.set(request, createCacheResponse([{ id: 1 }, { id: 2 }, { id: 3 }]));
      const second = request.read()?.data;

      expect(second).not.toBe(first);
      expect(second[0]).toBe(first[0]);
      expect(second[1]).toBe(first[1]);
    });

    it("should replace the data when the structural sharing is disabled", () => {
      const withoutSharing = request.setStructuralSharing(false);
      const next = { id: 1 };
      client.cache.set(withoutSharing, createCacheResponse({ id: 1 }));

      client.cache.set(withoutSharing, createCacheResponse(next));

      expect(request.read()?.data).toBe(next);
    });

    it("should share the data of the updates", () => {
      client.cache.set(request, createCacheResponse({ users: [{ id: 1 }] }));
      const first = request.read()?.data;

      client.cache.update(request, { data: { users: [{ id: 1 }] } });

      expect(request.read()?.data).toBe(first);
    });

    it("should share the data when a falsy value is replaced with the equal one", () => {
      client.cache.set(request, createCacheResponse(0));
      client.cache.set(request, createCacheResponse(0));

      expect(request.read()?.data).toBe(0);
    });

    it("should emit the previous data reference together with the error", () => {
      const spy = vi.fn();
      client.cache.set(request, createCacheResponse({ id: 1 }));
      const first = request.read()?.data;
      client.cache.events.onDataByKey(request.cacheKey, spy);

      client.cache.set(request, createCacheErrorResponse({ message: "Failed" }));

      expect(spy.mock.calls[0][0].data).toBe(first);
    });

    it("should store the circular data without failing", () => {
      const createCircular = () => {
        const data: Record<string, unknown> = { id: 1 };
        data.self = data;
        return data;
      };

      client.cache.set(request, createCacheResponse(createCircular()));
      client.cache.set(request, createCacheResponse(createCircular()));

      expect(request.read()?.data.id).toBe(1);
    });

    it("should not share the data between different cache keys", () => {
      const other = request.setCacheKey("other");
      client.cache.set(request, createCacheResponse({ id: 1 }));

      client.cache.set(other, createCacheResponse({ id: 1 }));

      expect(other.read()?.data).not.toBe(request.read()?.data);
    });
  });
});
