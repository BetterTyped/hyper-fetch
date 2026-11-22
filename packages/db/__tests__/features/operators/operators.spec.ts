/* oxlint-disable no-useless-undefined -- comparing with undefined is the behavior under test */
import { and, eq, gt, gte, inArray, lt, lte, not, or } from "@hyper-fetch/db";
import type { RowRefs } from "@hyper-fetch/db";

import {
  compareValues,
  evaluate,
  getExpressionFields,
  isEqualValue,
  splitAnd,
  stableStringify,
} from "../../../src/operators/operators.utils";

type TestRow = { id: number; title: string; deleted: number | null; a: number; b: number; c: number };

const refs = new Proxy({}, { get: (_target, field) => ({ kind: "field", field }) }) as RowRefs<TestRow>;

describe("Operators", () => {
  describe("compareValues", () => {
    it("sorts NaN after every number, consistently in both directions", () => {
      expect(compareValues(Number.NaN, 5)).toBe(1);
      expect(compareValues(5, Number.NaN)).toBe(-1);
      expect(compareValues(Number.NaN, Number.NaN)).toBe(0);
      expect([3, Number.NaN, -1].toSorted(compareValues)).toStrictEqual([-1, 3, Number.NaN]);
    });

    it("sorts empty values first", () => {
      expect(compareValues(null, undefined)).toBe(0);
      expect(compareValues(null, 1)).toBe(-1);
      expect(compareValues(1, undefined)).toBe(1);
    });

    it("compares strings by code point, whatever their length", () => {
      expect(compareValues("a", "b")).toBe(-1);
      expect(compareValues("b", "a")).toBe(1);
      expect(compareValues("ab", "a")).toBe(1);
      expect(compareValues("a", "ab")).toBe(-1);
      expect(compareValues("same", "same")).toBe(0);
      expect(compareValues("😀", "￿")).toBe(1);
    });

    it("compares dates by instant and values of different types by type name", () => {
      expect(compareValues(new Date(1), new Date(2))).toBe(-1);
      expect(compareValues(new Date(2), new Date(2))).toBe(0);
      expect(compareValues(1, "1")).toBe(-1);
      expect(compareValues(2, 1)).toBe(1);
      expect(compareValues(Number.NaN, Number.NaN)).toBe(0);
    });

    it("treats dates of the same instant as equal", () => {
      expect(isEqualValue(new Date(5), new Date(5))).toBeTrue();
      expect(isEqualValue(Number.NaN, Number.NaN)).toBeTrue();
      expect(isEqualValue(1, "1")).toBeFalse();
    });
  });

  describe("evaluate", () => {
    const row = { id: 2, title: "b", deleted: null };

    it("evaluates every comparison", () => {
      expect(evaluate(eq(refs.id, 2).node, row)).toBeTrue();
      expect(evaluate(inArray(refs.id, [1, 3]).node, row)).toBeFalse();
      expect(evaluate(gt(refs.id, 1).node, row)).toBeTrue();
      expect(evaluate(gte(refs.id, 2).node, row)).toBeTrue();
      expect(evaluate(lt(refs.id, 2).node, row)).toBeFalse();
      expect(evaluate(lte(refs.id, 2).node, row)).toBeTrue();
    });

    it("never matches an empty value with a range comparison", () => {
      ([gt, gte, lt, lte] as const).forEach((operator) => {
        expect(evaluate(operator(refs.deleted, 1).node, row)).toBeFalse();
      });
    });

    it("evaluates and, or and not", () => {
      expect(evaluate(and(eq(refs.id, 2), eq(refs.title, "b")).node, row)).toBeTrue();
      expect(evaluate(or(eq(refs.id, 3), eq(refs.title, "b")).node, row)).toBeTrue();
      expect(evaluate(not(eq(refs.id, 2)).node, row)).toBeFalse();
    });
  });

  describe("expression helpers", () => {
    it("splits a query at its top-level and, flattening nested ones", () => {
      const node = and(eq(refs.a, 1), and(eq(refs.b, 2), or(eq(refs.c, 3)))).node;
      expect(splitAnd(node).map((item) => item.op)).toStrictEqual(["eq", "eq", "or"]);
      expect(splitAnd(undefined)).toStrictEqual([]);
    });

    it("lists the fields an expression reads", () => {
      const node = and(eq(refs.a, 1), or(eq(refs.b, 2), not(eq(refs.c, 3)))).node;
      expect(getExpressionFields(node)).toStrictEqual(["a", "b", "c"]);
    });

    it("stringifies values structurally", () => {
      expect(stableStringify({ b: [new Date(1)], a: 1 })).toBe(stableStringify({ a: 1, b: [new Date(1)] }));
      expect(stableStringify(undefined)).toBe('{"$undefined":true}');
      // Values JSON cannot tell apart stay apart
      const values = [
        10n,
        Number.NaN,
        Infinity,
        -Infinity,
        null,
        undefined,
        new Map([[1, 2]]),
        new Map([[1, 3]]),
        new Set([1]),
      ];
      expect(new Set(values.map(stableStringify)).size).toBe(values.length);
      expect(stableStringify(new Date(3))).toBe('{"$date":3}');
    });
  });
});
