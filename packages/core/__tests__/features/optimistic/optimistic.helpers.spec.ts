import { Client } from "client";
import { optimistic } from "optimistic";
import type { OptimisticOperation } from "optimistic";

type Todo = { id: number; title: string; done: boolean; likes: number; tags?: string[] };
type Feed = { cursor: string | null; total: number; items: Todo[]; meta: { pages: number } };

const createTodo = (id: number, extra: Partial<Todo> = {}): Todo => ({
  id,
  title: `todo-${id}`,
  done: false,
  likes: 0,
  ...extra,
});

/**
 * Operations are pure descriptions - `update` is the transformation core applies to the cached data
 */
const apply = <Data>(operation: OptimisticOperation<Data, any>, data: Data): Data => operation.update(data);

describe("Optimistic [ Helpers ]", () => {
  const client = new Client({ url: "shared-base-url" });
  const getTodos = client.createRequest<{ response: Todo[] }>()({ endpoint: "/todos" });
  const getFeed = client.createRequest<{ response: Feed }>()({ endpoint: "/feed" });
  const getTodo = client.createRequest<{ response: Todo }>()({ endpoint: "/todos/:todoId" });

  let list: Todo[];
  let feed: Feed;

  beforeEach(() => {
    list = [createTodo(1), createTodo(2), createTodo(3)];
    feed = { cursor: "c1", total: 3, items: list, meta: { pages: 1 } };
  });

  describe("when using set", () => {
    it("should replace the data with the updater result", () => {
      const result = apply(
        optimistic(getTodo.setParams({ todoId: 1 })).set((todo) => ({ ...todo, title: "changed" })),
        list[0],
      );

      expect(result).toStrictEqual({ ...list[0], title: "changed" });
      expect(list[0].title).toBe("todo-1");
    });

    it("should pass the data of a list target", () => {
      const updater = vi.fn((todos: Todo[]) => todos.slice(1));
      const result = apply(optimistic(getTodos).set(updater), list);

      expect(updater).toHaveBeenCalledWith(list);
      expect(result).toStrictEqual([list[1], list[2]]);
    });
  });

  describe("when using patch", () => {
    it("should patch the item matched by id value", () => {
      const result = apply(optimistic(getTodos).patch(2, { done: true }), list);

      expect(result).toStrictEqual([list[0], { ...list[1], done: true }, list[2]]);
    });

    it("should match a string id with a number id like route params do", () => {
      const result = apply(optimistic(getTodos).patch("2", { done: true }), list);

      expect(result[1].done).toBeTrue();
    });

    it("should patch the items matched by predicate", () => {
      const result = apply(
        optimistic(getTodos).patch((todo) => todo.id !== 2, { done: true }),
        list,
      );

      expect(result.map((todo) => todo.done)).toStrictEqual([true, false, true]);
    });

    it("should match by custom key", () => {
      const result = apply(optimistic(getTodos).patch("todo-3", { done: true }, { key: "title" }), list);

      expect(result.map((todo) => todo.done)).toStrictEqual([false, false, true]);
    });

    it("should keep unchanged items referentially equal", () => {
      const result = apply(optimistic(getTodos).patch(2, { done: true }), list);

      expect(result[0]).toBe(list[0]);
      expect(result[2]).toBe(list[2]);
      expect(result[1]).not.toBe(list[1]);
    });

    it("should return the same list when nothing matched", () => {
      expect(apply(optimistic(getTodos).patch(99, { done: true }), list)).toBe(list);
    });

    it("should return the same empty list", () => {
      const empty: Todo[] = [];
      expect(apply(optimistic(getTodos).patch(1, { done: true }), empty)).toBe(empty);
    });

    it("should patch several matches", () => {
      const duplicated = [createTodo(1), createTodo(1, { title: "twin" }), createTodo(2)];
      const result = apply(optimistic(getTodos).patch(1, { likes: 5 }), duplicated);

      expect(result.map((todo) => todo.likes)).toStrictEqual([5, 5, 0]);
    });

    it("should replace nested values instead of merging them deeply", () => {
      const tagged = [createTodo(1, { tags: ["a", "b"] })];
      const result = apply(optimistic(getTodos).patch(1, { tags: ["c"] }), tagged);

      expect(result[0].tags).toStrictEqual(["c"]);
    });

    it("should patch the items of a list field", () => {
      const result = apply(optimistic(getFeed).list("items").patch(1, { done: true }), feed);

      expect(result.items[0].done).toBeTrue();
      expect(result.meta).toBe(feed.meta);
      expect(result.cursor).toBe("c1");
    });

    it("should return the same object when nothing in a list field matched", () => {
      expect(apply(optimistic(getFeed).list("items").patch(99, { done: true }), feed)).toBe(feed);
    });

    it("should skip primitives and nulls when matching by value", () => {
      const mixed = [null, 1, createTodo(1)] as unknown as Todo[];
      const result = apply(optimistic(getTodos).patch(1, { done: true }), mixed);

      expect(result[0]).toBeNull();
      expect(result[1]).toBe(1);
      expect(result[2].done).toBeTrue();
    });
  });

  describe("when using insert", () => {
    it("should add the item at the end by default", () => {
      const result = apply(optimistic(getTodos).insert(createTodo(4)), list);

      expect(result.map((todo) => todo.id)).toStrictEqual([1, 2, 3, 4]);
      expect(list).toHaveLength(3);
    });

    it("should add the item at the start", () => {
      const result = apply(optimistic(getTodos).insert(createTodo(4), { at: "start" }), list);

      expect(result.map((todo) => todo.id)).toStrictEqual([4, 1, 2, 3]);
    });

    it("should add the item at the end explicitly", () => {
      const result = apply(optimistic(getTodos).insert(createTodo(4), { at: "end" }), list);

      expect(result.map((todo) => todo.id)).toStrictEqual([1, 2, 3, 4]);
    });

    it("should add the item at the index", () => {
      const result = apply(optimistic(getTodos).insert(createTodo(4), { at: 1 }), list);

      expect(result.map((todo) => todo.id)).toStrictEqual([1, 4, 2, 3]);
    });

    it("should add the item to an empty list", () => {
      expect(apply(optimistic(getTodos).insert(createTodo(4)), [])).toStrictEqual([createTodo(4)]);
    });

    it("should add the item to a list field", () => {
      const result = apply(optimistic(getFeed).list("items").insert(createTodo(4), { at: "start" }), feed);

      expect(result.items.map((todo) => todo.id)).toStrictEqual([4, 1, 2, 3]);
      expect(result.total).toBe(3);
    });

    it("should create a missing list field", () => {
      const noItems = { ...feed, items: undefined } as unknown as Feed;
      const result = apply(optimistic(getFeed).list("items").insert(createTodo(4)), noItems);

      expect(result.items).toStrictEqual([createTodo(4)]);
    });
  });

  describe("when using remove", () => {
    it("should remove the item matched by id value", () => {
      const result = apply(optimistic(getTodos).remove(2), list);

      expect(result).toStrictEqual([list[0], list[2]]);
    });

    it("should remove the items matched by predicate", () => {
      const result = apply(
        optimistic(getTodos).remove((todo) => todo.id > 1),
        list,
      );

      expect(result).toStrictEqual([list[0]]);
    });

    it("should remove by custom key", () => {
      expect(apply(optimistic(getTodos).remove("todo-1", { key: "title" }), list)).toStrictEqual([list[1], list[2]]);
    });

    it("should return the same list when nothing matched", () => {
      expect(apply(optimistic(getTodos).remove(99), list)).toBe(list);
    });

    it("should remove from a list field", () => {
      const result = apply(optimistic(getFeed).list("items").remove(1), feed);

      expect(result.items.map((todo) => todo.id)).toStrictEqual([2, 3]);
    });

    it("should keep the object of a missing list field", () => {
      const noItems = { ...feed, items: undefined } as unknown as Feed;
      expect(apply(optimistic(getFeed).list("items").remove(1), noItems)).toBe(noItems);
    });
  });

  describe("when using increment", () => {
    it("should increment a field of the data", () => {
      const result = apply(optimistic(getFeed).increment("total", -1), feed);

      expect(result.total).toBe(2);
      expect(result.items).toBe(feed.items);
    });

    it("should start from zero when the field is missing", () => {
      const noTotal = { ...feed, total: undefined } as unknown as Feed;
      expect(apply(optimistic(getFeed).increment("total", 2), noTotal).total).toBe(2);
    });

    it("should increment a field of the matched items", () => {
      const result = apply(optimistic(getTodos).increment(2, "likes", 3), list);

      expect(result.map((todo) => todo.likes)).toStrictEqual([0, 3, 0]);
      expect(result[0]).toBe(list[0]);
    });

    it("should increment by predicate and custom key", () => {
      const byPredicate = apply(
        optimistic(getTodos).increment((todo) => todo.id < 3, "likes", 1),
        list,
      );
      const byKey = apply(optimistic(getTodos).increment("todo-3", "likes", 1, { key: "title" }), list);

      expect(byPredicate.map((todo) => todo.likes)).toStrictEqual([1, 1, 0]);
      expect(byKey.map((todo) => todo.likes)).toStrictEqual([0, 0, 1]);
    });

    it("should return the same list when nothing matched", () => {
      expect(apply(optimistic(getTodos).increment(99, "likes", 1), list)).toBe(list);
    });

    it("should increment items of a list field", () => {
      const result = apply(optimistic(getFeed).list("items").increment(1, "likes", 2), feed);

      expect(result.items[0].likes).toBe(2);
    });
  });

  describe("when the data has the wrong shape", () => {
    it("should throw from list helpers on an object", () => {
      const operation = optimistic(getTodos).patch(1, { done: true });

      expect(() => apply(operation, feed as unknown as Todo[])).toThrow(TypeError);
    });

    it("should throw from increment(field, by) on a list", () => {
      const operation = optimistic(getFeed).increment("total", 1);

      expect(() => apply(operation, list as unknown as Feed)).toThrow(TypeError);
    });

    it("should throw from a list field that is not an array", () => {
      const broken = { ...feed, items: "nope" } as unknown as Feed;

      expect(() => apply(optimistic(getFeed).list("items").insert(createTodo(4)), broken)).toThrow(TypeError);
    });

    it("should throw from a list field of null data", () => {
      expect(() => apply(optimistic(getFeed).list("items").insert(createTodo(4)), null as unknown as Feed)).toThrow(
        TypeError,
      );
    });
  });

  describe("when chaining", () => {
    it("should return new operations from rollback and commit", () => {
      const base = optimistic(getTodos).remove(1);
      const rollback = () => {};
      const commit = () => {};
      const withRollback = base.rollback(rollback);
      const withBoth = withRollback.commit(commit);

      expect(base.onRollback).toBeUndefined();
      expect(withRollback.onRollback).toBe(rollback);
      expect(withRollback.onCommit).toBeUndefined();
      expect(withBoth.onRollback).toBe(rollback);
      expect(withBoth.onCommit).toBe(commit);
      expect(withBoth.commit(commit).rollback(rollback).update).toBe(base.update);
    });

    it("should target the request or all of its variants", () => {
      expect(optimistic(getTodos).remove(1).allVariants).toBeFalse();
      expect(optimistic.all(getTodos).remove(1).allVariants).toBeTrue();
      expect(optimistic.all(getTodos).remove(1).target).toBe(getTodos);
    });
  });
});
