import { createTrackedProxy, getBounceData, isEmpty, isEqual } from "utils";

describe("Utils", () => {
  describe("given createTrackedProxy util", () => {
    const createProxy = () => {
      const tracked = vi.fn();
      const proxy = createTrackedProxy(
        { data: 1, loading: false, refetch: () => "called" },
        ["data", "loading"],
        tracked,
      );
      return { proxy, tracked };
    };

    it("should return the values of the target", () => {
      const { proxy } = createProxy();

      expect(proxy.data).toBe(1);
      expect(proxy.loading).toBeFalse();
      expect(proxy.refetch()).toBe("called");
    });
    it("should report only the tracked keys that were read", () => {
      const { proxy, tracked } = createProxy();

      expect(proxy.data).toBe(1);
      expect(proxy.refetch).toBeFunction();

      expect(tracked.mock.calls).toStrictEqual([["data"]]);
    });
    it("should report nothing when nothing is read", () => {
      const { tracked } = createProxy();

      expect(tracked).not.toHaveBeenCalled();
    });
    it("should report every tracked key on destructuring with the rest", () => {
      const { proxy, tracked } = createProxy();

      const { ...rest } = proxy;

      expect(rest.data).toBe(1);
      expect(tracked.mock.calls.flat().toSorted()).toStrictEqual(["data", "loading"]);
    });
    it("should keep the keys enumerable", () => {
      const { proxy } = createProxy();

      expect(Object.keys(proxy)).toStrictEqual(["data", "loading", "refetch"]);
    });
    it("should not report symbol reads", () => {
      const { proxy, tracked } = createProxy();

      expect((proxy as Record<symbol, unknown>)[Symbol.toStringTag]).toBeUndefined();
      expect(tracked).not.toHaveBeenCalled();
    });
  });

  describe("given getBounceData util", () => {
    it("should expose only the state and reset", () => {
      const reset = vi.fn();
      const bounce = getBounceData({ active: true, reset, debounce: vi.fn(), throttle: vi.fn() } as any);

      expect(bounce.active).toBeTrue();
      expect(bounce.reset).toBe(reset);
      expect((bounce as Record<string, unknown>).debounce).toBeUndefined();
      expect((bounce as Record<string, unknown>).throttle).toBeUndefined();
    });
  });

  describe("given isEqual util", () => {
    it.each([
      [1, 1],
      ["a", "a"],
      [null, null],
      [undefined, undefined],
      [Number.NaN, Number.NaN],
      [[], []],
      [{}, {}],
      [
        [1, [2, { a: 3 }]],
        [1, [2, { a: 3 }]],
      ],
      [{ a: { b: { c: [1, 2] } } }, { a: { b: { c: [1, 2] } } }],
      [new Date(1000), new Date(1000)],
      [{ a: undefined }, { a: undefined }],
    ])("should treat %j and %j as equal", (first, second) => {
      expect(isEqual(first, second)).toBeTrue();
    });
    it.each([
      [1, 2],
      [1, "1"],
      [null, undefined],
      [null, {}],
      [[], {}],
      [
        [1, 2],
        [2, 1],
      ],
      [[1], [1, 2]],
      [{ a: 1 }, { a: 2 }],
      [{ a: 1 }, { b: 1 }],
      [{ a: 1 }, { a: 1, b: 2 }],
      [{ a: { b: 1 } }, { a: { b: 2 } }],
      [new Date(1000), new Date(2000)],
      [0, false],
      ["", null],
    ])("should treat %j and %j as different", (first, second) => {
      expect(isEqual(first, second)).toBeFalse();
    });
    it("should compare functions by reference", () => {
      const callback = () => null;

      expect(isEqual(callback, callback)).toBeTrue();
      expect(isEqual(callback, () => null)).toBeFalse();
    });
  });

  describe("given isEmpty util", () => {
    it.each([[[]], [{}]])("should treat %j as empty", (value) => {
      expect(isEmpty(value)).toBeTrue();
    });
    it.each([[[1]], [{ a: 1 }], [null], [undefined], [0], [""], [new Date()]])(
      "should not treat %j as empty",
      (value) => {
        expect(isEmpty(value)).toBeFalse();
      },
    );
  });
});
