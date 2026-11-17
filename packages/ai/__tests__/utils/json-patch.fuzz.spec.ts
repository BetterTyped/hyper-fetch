import type { JSONPatchOperationType } from "@hyper-fetch/ai";
import { applyJSONPatch, JSONPatchError } from "@hyper-fetch/ai";

import type { JSONValueType, RandomType } from "./fuzz.utils";
import {
  collectContainers,
  createRandom,
  deepFreeze,
  randomJSONValue,
  randomOperation,
  ReferencePatchError,
  referenceApplyPatch,
} from "./fuzz.utils";

// Fuzz tests do a lot of work in a single test - leave headroom for slow or busy CI machines
vi.setConfig({ testTimeout: 30_000 });

type OutcomeType = { ok: true; value: unknown } | { ok: false };

const runOurs = (document: unknown, operations: JSONPatchOperationType[]): OutcomeType => {
  try {
    return { ok: true, value: applyJSONPatch(document, operations) };
  } catch (error) {
    // Anything but a JSONPatchError (e.g. a TypeError from writing to the frozen input) is a bug
    if (!(error instanceof JSONPatchError)) {
      throw error;
    }
    return { ok: false };
  }
};

const runReference = (document: unknown, operations: JSONPatchOperationType[]): OutcomeType => {
  try {
    return { ok: true, value: referenceApplyPatch(document, operations) };
  } catch (error) {
    if (!(error instanceof ReferencePatchError)) {
      throw error;
    }
    return { ok: false };
  }
};

const randomDocument = (random: RandomType): JSONValueType => {
  // Containers at the root make far more interesting targets than a primitive document
  const document = randomJSONValue(random);
  return document !== null && typeof document === "object" ? document : { a: document, list: [1, 2, 3] };
};

type FastJSONPatchType = {
  applyPatch: (...args: [document: unknown, patch: unknown[], validate: boolean, mutate: boolean]) => {
    newDocument: unknown;
  };
};

// `fast-json-patch` is what the official AG-UI client applies STATE_DELTA events with. It is not a dependency of
// this package - it is only compared against when the workspace has it installed.
const fastJSONPatchModule = "fast-json-patch";
const fastJSONPatch: FastJSONPatchType | null = await import(/* @vite-ignore */ fastJSONPatchModule).then(
  (module) => (module.default ?? module) as FastJSONPatchType,
  () => null,
);

describe("applyJSONPatch - property and differential tests", () => {
  describe("reference implementation", () => {
    it("should agree with a naive reference on 6000 random single operations", () => {
      const random = createRandom(161);
      let applied = 0;
      for (let run = 0; run < 6000; run += 1) {
        const document = deepFreeze(randomDocument(random));
        const operation = deepFreeze(randomOperation(random, document));
        const context = `run ${run}: ${JSON.stringify(operation)} on ${JSON.stringify(document)}`;

        const expected = runReference(document, [operation]);
        const actual = runOurs(document, [operation]);
        expect(actual.ok, context).toBe(expected.ok);
        if (actual.ok && expected.ok) {
          applied += 1;
          expect(actual.value, context).toEqual(expected.value);
          expect(JSON.stringify(actual.value), context).toBe(JSON.stringify(expected.value));
        }
      }
      // The generator must produce plenty of both valid and invalid operations
      expect(applied).toBeGreaterThan(2000);
      expect(6000 - applied).toBeGreaterThan(500);
    });

    it("should agree with a naive reference on 600 random patch sequences", () => {
      const random = createRandom(178);
      for (let run = 0; run < 600; run += 1) {
        const initial = deepFreeze(randomDocument(random));
        // Build a sequence where every operation is generated for the document as it is at that point
        const operations: JSONPatchOperationType[] = [];
        let current: unknown = initial;
        const length = 1 + random.int(12);
        for (let i = 0; i < length; i += 1) {
          const operation = deepFreeze(randomOperation(random, current));
          const step = runReference(current, [operation]);
          const actualStep = runOurs(current, [operation]);
          const context = `run ${run}, step ${i}: ${JSON.stringify(operation)} on ${JSON.stringify(current)}`;
          expect(actualStep.ok, context).toBe(step.ok);
          if (step.ok && actualStep.ok) {
            expect(actualStep.value, context).toEqual(step.value);
            operations.push(operation);
            current = deepFreeze(actualStep.value);
          }
        }

        // Applying the whole sequence at once gives the same document as applying it step by step
        const context = `run ${run}: ${JSON.stringify(operations)} on ${JSON.stringify(initial)}`;
        const whole = applyJSONPatch(initial, operations);
        expect(whole, context).toEqual(current);
        expect(whole, context).toEqual(referenceApplyPatch(initial, operations));
      }
    });

    it("should reject a whole sequence when any operation fails", () => {
      const random = createRandom(195);
      let rejected = 0;
      for (let run = 0; run < 400; run += 1) {
        const document = deepFreeze(randomDocument(random));
        const snapshot = JSON.stringify(document);
        const operations = Array.from({ length: 1 + random.int(6) }, () =>
          deepFreeze(randomOperation(random, document)),
        );
        const expected = runReference(document, operations);
        const actual = runOurs(document, operations);
        const context = `run ${run}: ${JSON.stringify(operations)} on ${snapshot}`;
        expect(actual.ok, context).toBe(expected.ok);
        if (actual.ok && expected.ok) {
          expect(actual.value, context).toEqual(expected.value);
        } else {
          rejected += 1;
        }
        expect(JSON.stringify(document), context).toBe(snapshot);
      }
      expect(rejected).toBeGreaterThan(50);
    });
  });

  describe("immutability", () => {
    it("should never mutate the document or the operations", () => {
      const random = createRandom(212);
      for (let run = 0; run < 1500; run += 1) {
        // Frozen inputs: any write throws a TypeError, which runOurs does not swallow
        const document = deepFreeze(randomDocument(random));
        const operations = deepFreeze(
          Array.from({ length: 1 + random.int(4) }, () => randomOperation(random, document)),
        );
        const documentSnapshot = JSON.stringify(document);
        const operationsSnapshot = JSON.stringify(operations);
        runOurs(document, operations);
        expect(JSON.stringify(document)).toBe(documentSnapshot);
        expect(JSON.stringify(operations)).toBe(operationsSnapshot);
      }
    });

    it("should return a result that does not change when the patch is applied again", () => {
      const random = createRandom(229);
      for (let run = 0; run < 500; run += 1) {
        const document = randomDocument(random);
        const operation = randomOperation(random, document);
        const first = runOurs(document, [operation]);
        if (first.ok) {
          const snapshot = JSON.stringify(first.value);
          runOurs(first.value, [operation]);
          runOurs(document, [operation]);
          expect(JSON.stringify(first.value), `run ${run}`).toBe(snapshot);
        }
      }
    });

    it("should return the same reference when only tests are applied", () => {
      const random = createRandom(246);
      for (let run = 0; run < 300; run += 1) {
        const document = randomDocument(random);
        const operations = Array.from({ length: 3 }, () => randomOperation(random, document)).filter(
          (operation) => operation.op === "test",
        );
        const outcome = runOurs(document, operations);
        if (outcome.ok) {
          expect(outcome.value, `run ${run}`).toBe(document);
        }
      }
    });
  });

  describe("structural sharing", () => {
    it("should keep the identity of every container outside of the changed path", () => {
      const random = createRandom(23);
      let checked = 0;
      for (let run = 0; run < 3000; run += 1) {
        const document = randomDocument(random);
        const operation = randomOperation(random, document);
        if (operation.op === "test" || operation.op === "copy" || operation.op === "move") {
          continue;
        }
        const outcome = runOurs(document, [operation]);
        if (!outcome.ok || operation.path === "") {
          continue;
        }
        checked += 1;
        const context = `run ${run}: ${JSON.stringify(operation)} on ${JSON.stringify(document)}`;
        const tokens = operation.path
          .slice(1)
          .split("/")
          .map((token) => token.replaceAll("~1", "/").replaceAll("~0", "~"));

        // Containers on the way to the target are copied, the old value at the target is dropped. Everything else
        // - every sibling subtree at every level - must be the very same object as before.
        const copied = new Set<unknown>();
        let cursor: unknown = document;
        tokens.forEach((token, index) => {
          copied.add(cursor);
          const isLast = index === tokens.length - 1;
          const container = cursor as Record<string, unknown>;
          const exists = Array.isArray(container)
            ? token !== "-" && Number(token) < container.length
            : Object.hasOwn(container, token);
          cursor = exists ? container[token] : undefined;
          if (isLast && exists && (operation.op !== "add" || !Array.isArray(container))) {
            // The replaced or removed value (an insert into an array keeps the element that was at that index)
            collectContainers(cursor).forEach((dropped) => copied.add(dropped));
          }
        });

        const after = collectContainers(outcome.value);
        collectContainers(document).forEach((container) => {
          if (copied.has(container)) {
            expect(after.has(container), `${context} - a container on the path was not copied`).toBe(false);
          } else {
            expect(after.has(container), `${context} - an untouched container lost its identity`).toBe(true);
          }
        });
        expect(outcome.value, context).not.toBe(document);
      }
      expect(checked).toBeGreaterThan(800);
    });

    it("should keep the identity of a moved value and of everything outside both paths", () => {
      const document = {
        source: { item: { deep: [1, 2] }, sibling: { x: 1 } },
        target: { existing: { y: 2 } },
        unrelated: { z: [3] },
      };
      const result = applyJSONPatch<{
        source: Record<string, unknown>;
        target: Record<string, unknown>;
        unrelated: unknown;
      }>(document, [{ op: "move", from: "/source/item", path: "/target/item" }]);

      expect(result.target.item).toBe(document.source.item);
      expect(result.source.sibling).toBe(document.source.sibling);
      expect(result.target.existing).toBe(document.target.existing);
      expect(result.unrelated).toBe(document.unrelated);
      expect(result.source).not.toBe(document.source);
      expect(result.target).not.toBe(document.target);
    });

    it("should keep the identity of the copy source and of everything outside the target path", () => {
      const document = { source: { deep: [1, 2] }, target: {}, unrelated: [{ z: 3 }] };
      const result = applyJSONPatch<{
        source: unknown;
        target: Record<string, unknown>;
        unrelated: unknown;
      }>(document, [{ op: "copy", from: "/source", path: "/target/copy" }]);

      expect(result.source).toBe(document.source);
      expect(result.unrelated).toBe(document.unrelated);
      expect(result.target.copy).toEqual(document.source);
      expect(result.target.copy).not.toBe(document.source);
    });

    it("should only copy the containers along a deep path", () => {
      type NodeType = { child?: NodeType; side: { id: number }; value: number };
      const build = (depth: number): NodeType =>
        depth === 0
          ? { side: { id: depth }, value: 0 }
          : { child: build(depth - 1), side: { id: depth }, value: depth };
      const document = build(200);
      const path = `${"/child".repeat(200)}/value`;
      const result = applyJSONPatch<NodeType>(document, [{ op: "replace", path, value: -1 }]);

      let before: NodeType | undefined = document;
      let after: NodeType | undefined = result;
      let depth = 0;
      while (before && after) {
        expect(after).not.toBe(before);
        expect(after.side).toBe(before.side);
        before = before.child;
        after = after.child;
        depth += 1;
      }
      expect(depth).toBe(201);
      expect(document.child?.child?.value).toBe(198);
    });
  });

  describe("large documents", () => {
    it("should apply 2000 operations to a wide document", () => {
      const document = { items: Array.from({ length: 2000 }, (_, id) => ({ id, done: false })) };
      const operations: JSONPatchOperationType[] = document.items.map((_, index) => ({
        op: "replace",
        path: `/items/${index}/done`,
        value: true,
      }));
      const result = applyJSONPatch<typeof document>(document, operations);
      expect(result.items.every((item) => item.done)).toBe(true);
      expect(document.items.some((item) => item.done)).toBe(false);
    });

    it("should build a 5000 element array with appends", () => {
      const operations: JSONPatchOperationType[] = Array.from({ length: 5000 }, (_, value) => ({
        op: "add",
        path: "/list/-",
        value,
      }));
      const result = applyJSONPatch<{ list: number[] }>({ list: [] }, operations);
      expect(result.list).toHaveLength(5000);
      expect(result.list[4999]).toBe(4999);
    });
  });

  describe.skipIf(!fastJSONPatch)("differential: fast-json-patch", () => {
    // Keys fast-json-patch refuses for security reasons - HyperFetch treats them as plain own members instead
    const isBanned = (operation: JSONPatchOperationType) => /__proto__|prototype/.test(JSON.stringify(operation));

    it("should produce the same document for every operation both accept", () => {
      const random = createRandom(40);
      let compared = 0;
      for (let run = 0; run < 5000; run += 1) {
        const document = randomDocument(random);
        const operation = randomOperation(random, document);
        // Only operations that are valid by the RFC are compared: fast-json-patch is more lenient about invalid
        // ones (leading zeros in indices, moving into own children, removing the root)
        if (isBanned(operation) || !runReference(document, [operation]).ok) {
          continue;
        }
        const context = `run ${run}: ${JSON.stringify(operation)} on ${JSON.stringify(document)}`;
        const expected = (fastJSONPatch as FastJSONPatchType).applyPatch(
          structuredClone(document),
          [structuredClone(operation)],
          true,
          false,
        ).newDocument;
        expect(applyJSONPatch(document, [operation]), context).toEqual(expected);
        compared += 1;
      }
      expect(compared).toBeGreaterThan(2000);
    });

    it("should produce the same document for AG-UI style state deltas", () => {
      const state = { steps: [] as unknown[], status: "idle", meta: { tokens: 0 } };
      const patch: JSONPatchOperationType[] = [
        { op: "replace", path: "/status", value: "running" },
        { op: "add", path: "/steps/-", value: { title: "Plan", done: false } },
        { op: "add", path: "/steps/-", value: { title: "Write", done: false } },
        { op: "replace", path: "/steps/0/done", value: true },
        { op: "add", path: "/meta/model", value: "any" },
        { op: "replace", path: "/meta/tokens", value: 128 },
        { op: "move", from: "/steps/1", path: "/steps/0" },
        { op: "copy", from: "/steps/0", path: "/current" },
        { op: "test", path: "/current/title", value: "Write" },
        { op: "remove", path: "/meta/model" },
      ];
      const expected = (fastJSONPatch as FastJSONPatchType).applyPatch(
        structuredClone(state),
        structuredClone(patch),
        true,
        false,
      ).newDocument;
      expect(applyJSONPatch(state, patch)).toEqual(expected);
    });
  });
});
