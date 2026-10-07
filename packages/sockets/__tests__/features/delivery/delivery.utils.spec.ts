import type { DeliveryControllerType } from "delivery";
import {
  assertDelivery,
  createDeliveryController,
  createDeliveryStrategy,
  getDeliveryKey,
  isDeliveryStrategy,
} from "delivery";

describe("Delivery [ Utils ]", () => {
  describe("createDeliveryStrategy", () => {
    it("should return the given strategy untouched", () => {
      const strategy = createDeliveryStrategy<number, string>(({ deliver }) => ({
        push: ({ data, extra }) => deliver({ data: String(data), extra }),
        dispose: () => null,
      }));
      expect(typeof strategy).toBe("function");
      expect(isDeliveryStrategy(strategy)).toBeTrue();
      expect(isDeliveryStrategy({ strategy: "latest", interval: 1 })).toBeFalse();
    });
  });

  describe("assertDelivery", () => {
    it("should accept presets and custom strategies", () => {
      expect(() => assertDelivery({ strategy: "latest", interval: 10 })).not.toThrow();
      expect(() => assertDelivery({ strategy: "batch", interval: 10 })).not.toThrow();
      expect(() => assertDelivery(() => ({ push: () => null, dispose: () => null }))).not.toThrow();
    });
    it("should throw for an unknown preset", () => {
      expect(() => assertDelivery({ strategy: "nope", interval: 10 } as any)).toThrow(
        /Unknown delivery strategy: nope/,
      );
    });
  });

  describe("createDeliveryController", () => {
    it("should call a custom strategy with the context", () => {
      const controller: DeliveryControllerType<number> = { push: vi.fn(), dispose: vi.fn() };
      const strategy = vi.fn(() => controller);
      const deliver = vi.fn();
      const result = createDeliveryController<number, number, unknown>(strategy, { deliver });
      expect(strategy).toHaveBeenCalledOnce();
      expect(strategy).toHaveBeenCalledWith({ deliver });
      expect(result).toBe(controller);
    });
    it("should build the latest preset", () => {
      const deliver = vi.fn();
      const controller = createDeliveryController({ strategy: "latest", interval: 100 }, { deliver });
      controller.push({ data: 1, extra: null });
      expect(deliver).toHaveBeenCalledWith({ data: 1, extra: null });
      controller.dispose();
    });
    it("should build the batch preset", () => {
      vi.useFakeTimers();
      const deliver = vi.fn();
      const controller = createDeliveryController({ strategy: "batch", interval: 100 }, { deliver });
      controller.push({ data: 1, extra: null });
      controller.push({ data: 2, extra: null });
      vi.advanceTimersByTime(100);
      expect(deliver).toHaveBeenCalledWith({ data: [1, 2], extra: null });
      controller.dispose();
      vi.useRealTimers();
    });
  });

  describe("getDeliveryKey", () => {
    it("should compare presets by value and strategies by identity", () => {
      const strategy = () => ({ push: () => null, dispose: () => null });
      expect(getDeliveryKey()).toBe("");
      expect(getDeliveryKey({ strategy: "latest", interval: 16 })).toBe(
        getDeliveryKey({ strategy: "latest", interval: 16 }),
      );
      expect(getDeliveryKey({ strategy: "latest", interval: 16 })).not.toBe(
        getDeliveryKey({ strategy: "latest", interval: 32 }),
      );
      expect(getDeliveryKey(strategy)).toBe(strategy);
    });
  });

  describe("edge cases", () => {
    it("should throw a helpful error when the strategy key is missing", () => {
      expect(() => assertDelivery({ interval: 10 } as any)).toThrow(/Unknown delivery strategy: undefined/);
      expect(() => assertDelivery({ interval: 10 } as any)).toThrow(/createDeliveryStrategy/);
    });
    it("should build latest without leading", () => {
      vi.useFakeTimers();
      const deliver = vi.fn();
      const controller = createDeliveryController({ strategy: "latest", interval: 100, leading: false }, { deliver });
      controller.push({ data: 1, extra: null });
      expect(deliver).not.toHaveBeenCalled();
      vi.advanceTimersByTime(100);
      expect(deliver).toHaveBeenCalledWith({ data: 1, extra: null });
      controller.dispose();
      vi.useRealTimers();
    });
    it("should build batch with maxSize", () => {
      const deliver = vi.fn();
      const controller = createDeliveryController({ strategy: "batch", interval: 100, maxSize: 2 }, { deliver });
      controller.push({ data: 1, extra: null });
      controller.push({ data: 2, extra: null });
      expect(deliver).toHaveBeenCalledWith({ data: [1, 2], extra: null });
      controller.dispose();
    });
    it("should produce different keys for different presets", () => {
      expect(getDeliveryKey({ strategy: "latest", interval: 16 })).not.toBe(
        getDeliveryKey({ strategy: "batch", interval: 16 }),
      );
      expect(getDeliveryKey({ strategy: "batch", interval: 16 })).not.toBe(
        getDeliveryKey({ strategy: "batch", interval: 16, maxSize: 5 }),
      );
      expect(getDeliveryKey({ strategy: "latest", interval: 16, leading: false })).not.toBe(
        getDeliveryKey({ strategy: "latest", interval: 16 }),
      );
    });
    it("should produce different keys for different strategy functions", () => {
      const a = () => ({ push: () => null, dispose: () => null });
      const b = () => ({ push: () => null, dispose: () => null });
      expect(getDeliveryKey(a)).not.toBe(getDeliveryKey(b));
      expect(getDeliveryKey(a)).toBe(getDeliveryKey(a));
    });
  });
});
