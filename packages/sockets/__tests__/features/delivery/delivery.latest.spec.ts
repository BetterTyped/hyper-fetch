import { createLatestDeliveryStrategy } from "delivery";

type Message = { data: number; extra: { id: number } };

const message = (data: number): Message => ({ data, extra: { id: data } });

describe("Delivery [ Latest ]", () => {
  const setup = (options: { interval: number; leading?: boolean }) => {
    const deliver = vi.fn();
    const controller = createLatestDeliveryStrategy<number, { id: number }>(options)({ deliver });
    return { deliver, controller };
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should deliver the first message immediately", () => {
    const { deliver, controller } = setup({ interval: 100 });
    controller.push(message(1));
    expect(deliver).toHaveBeenCalledOnce();
    expect(deliver).toHaveBeenCalledWith(message(1));
  });

  it("should deliver only the newest message when the window closes", () => {
    const { deliver, controller } = setup({ interval: 100 });
    controller.push(message(1));
    controller.push(message(2));
    controller.push(message(3));
    expect(deliver).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(100);
    expect(deliver).toHaveBeenCalledTimes(2);
    expect(deliver).toHaveBeenLastCalledWith(message(3));
  });

  it("should not deliver a trailing message when nothing followed the leading one", () => {
    const { deliver, controller } = setup({ interval: 100 });
    controller.push(message(1));
    vi.advanceTimersByTime(500);
    expect(deliver).toHaveBeenCalledOnce();
  });

  it("should open the next window after a trailing delivery", () => {
    const { deliver, controller } = setup({ interval: 100 });
    controller.push(message(1)); // t=0 leading
    controller.push(message(2)); // pending
    vi.advanceTimersByTime(100); // t=100 trailing → 2, new window
    expect(deliver).toHaveBeenLastCalledWith(message(2));
    controller.push(message(3)); // inside the new window → must wait
    expect(deliver).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(100); // t=200 → 3
    expect(deliver).toHaveBeenCalledTimes(3);
    expect(deliver).toHaveBeenLastCalledWith(message(3));
  });

  it("should lead again after going idle", () => {
    const { deliver, controller } = setup({ interval: 100 });
    controller.push(message(1));
    vi.advanceTimersByTime(100); // window closes with nothing pending → idle
    controller.push(message(2));
    expect(deliver).toHaveBeenCalledTimes(2);
    expect(deliver).toHaveBeenLastCalledWith(message(2));
  });

  it("should wait for the interval when leading is disabled", () => {
    const { deliver, controller } = setup({ interval: 100, leading: false });
    controller.push(message(1));
    controller.push(message(2));
    expect(deliver).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(deliver).toHaveBeenCalledOnce();
    expect(deliver).toHaveBeenCalledWith(message(2));
  });

  it("should deliver the extra of the delivered message", () => {
    const { deliver, controller } = setup({ interval: 100 });
    controller.push(message(1));
    controller.push(message(2));
    controller.push(message(3));
    vi.advanceTimersByTime(100);
    expect(deliver).toHaveBeenLastCalledWith({ data: 3, extra: { id: 3 } });
  });

  it("should drop pending messages on dispose", () => {
    const { deliver, controller } = setup({ interval: 100 });
    controller.push(message(1));
    controller.push(message(2));
    controller.dispose();
    controller.dispose(); // idempotent
    vi.advanceTimersByTime(500);
    expect(deliver).toHaveBeenCalledOnce();
  });

  it("should ignore messages pushed after dispose", () => {
    const { deliver, controller } = setup({ interval: 100 });
    controller.dispose();
    controller.push(message(1));
    vi.advanceTimersByTime(500);
    expect(deliver).not.toHaveBeenCalled();
  });

  it("should allow disposing from inside the callback", () => {
    const deliver = vi.fn();
    const controller = createLatestDeliveryStrategy<number>({ interval: 100 })({
      deliver: (msg) => {
        deliver(msg);
        controller.dispose();
      },
    });
    controller.push(message(1)); // leading → disposes
    controller.push(message(2));
    vi.advanceTimersByTime(500);
    expect(deliver).toHaveBeenCalledOnce();
  });

  it("should coalesce messages per macrotask with interval 0", () => {
    const { deliver, controller } = setup({ interval: 0 });
    controller.push(message(1));
    controller.push(message(2));
    controller.push(message(3));
    expect(deliver).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(0);
    expect(deliver).toHaveBeenCalledTimes(2);
    expect(deliver).toHaveBeenLastCalledWith(message(3));
  });

  it("should deliver exactly leading + trailing for a burst of 1000 messages", () => {
    const { deliver, controller } = setup({ interval: 100 });
    for (let i = 1; i <= 1000; i += 1) {
      controller.push(message(i));
    }
    expect(deliver).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(100);
    expect(deliver).toHaveBeenCalledTimes(2);
    expect(deliver).toHaveBeenLastCalledWith(message(1000));
    vi.advanceTimersByTime(1000);
    expect(deliver).toHaveBeenCalledTimes(2);
  });

  it("should preserve order across many windows", () => {
    const { deliver, controller } = setup({ interval: 100 });
    controller.push(message(1));
    controller.push(message(2));
    vi.advanceTimersByTime(100);
    controller.push(message(3));
    controller.push(message(4));
    vi.advanceTimersByTime(100);
    controller.push(message(5));
    vi.advanceTimersByTime(100);
    vi.advanceTimersByTime(100); // idle
    controller.push(message(6));
    expect(deliver.mock.calls.map(([m]) => m.data)).toEqual([1, 2, 4, 5, 6]);
  });

  it("should treat a message arriving right after an idle window as leading", () => {
    const { deliver, controller } = setup({ interval: 100 });
    controller.push(message(1));
    vi.advanceTimersByTime(100); // closes with nothing pending → idle
    controller.push(message(2));
    expect(deliver).toHaveBeenCalledTimes(2);
    expect(deliver).toHaveBeenLastCalledWith(message(2));
  });

  it("should keep working after the callback throws", () => {
    const deliver = vi.fn().mockImplementationOnce(() => {
      throw new Error("boom");
    });
    const controller = createLatestDeliveryStrategy<number>({ interval: 100 })({ deliver });
    expect(() => controller.push(message(1))).toThrow("boom");
    controller.push(message(2));
    vi.advanceTimersByTime(100);
    expect(deliver).toHaveBeenCalledTimes(2);
    expect(deliver).toHaveBeenLastCalledWith(message(2));
    controller.push(message(3));
    vi.advanceTimersByTime(100);
    expect(deliver).toHaveBeenLastCalledWith(message(3));
  });

  it("should keep working after a trailing callback throws", () => {
    const deliver = vi.fn();
    const controller = createLatestDeliveryStrategy<number>({ interval: 100 })({ deliver });
    controller.push(message(1));
    controller.push(message(2));
    deliver.mockImplementationOnce(() => {
      throw new Error("boom");
    });
    expect(() => vi.advanceTimersByTime(100)).toThrow("boom");
    controller.push(message(3)); // still inside the window re-armed before the throw
    vi.advanceTimersByTime(100);
    expect(deliver).toHaveBeenLastCalledWith(message(3));
  });

  it("should go idle and lead again when leading is disabled", () => {
    const { deliver, controller } = setup({ interval: 100, leading: false });
    controller.push(message(1));
    vi.advanceTimersByTime(100);
    expect(deliver).toHaveBeenCalledWith(message(1));
    vi.advanceTimersByTime(100); // nothing pending → idle
    controller.push(message(2));
    expect(deliver).toHaveBeenCalledOnce(); // not immediate
    vi.advanceTimersByTime(100);
    expect(deliver).toHaveBeenLastCalledWith(message(2));
  });

  it("should deliver the same object reference that was pushed", () => {
    const { deliver, controller } = setup({ interval: 100 });
    const first = message(1);
    const last = message(3);
    controller.push(first);
    controller.push(message(2));
    controller.push(last);
    vi.advanceTimersByTime(100);
    expect(deliver.mock.calls[0][0]).toBe(first);
    expect(deliver.mock.calls[1][0]).toBe(last);
  });

  it("should be a no-op to dispose while idle", () => {
    const { deliver, controller } = setup({ interval: 100 });
    expect(() => controller.dispose()).not.toThrow();
    vi.advanceTimersByTime(100);
    expect(deliver).not.toHaveBeenCalled();
  });

  it("should not create timers before the first message", () => {
    setup({ interval: 100 });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("should clear all timers on dispose", () => {
    const { controller } = setup({ interval: 100 });
    controller.push(message(1));
    expect(vi.getTimerCount()).toBe(1);
    controller.dispose();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("should give independent state to controllers created from one factory", () => {
    const factory = createLatestDeliveryStrategy<number>({ interval: 100 });
    const first = vi.fn();
    const second = vi.fn();
    const a = factory({ deliver: first });
    const b = factory({ deliver: second });
    a.push(message(1));
    a.push(message(2));
    b.push(message(10));
    vi.advanceTimersByTime(100);
    expect(first.mock.calls.map(([m]) => m.data)).toEqual([1, 2]);
    expect(second.mock.calls.map(([m]) => m.data)).toEqual([10]);
  });
});
