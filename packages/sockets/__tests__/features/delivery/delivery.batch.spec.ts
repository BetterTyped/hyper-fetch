import { createBatchDeliveryStrategy } from "delivery";

type Message = { data: number; extra: { id: number } };

const message = (data: number): Message => ({ data, extra: { id: data } });

describe("Delivery [ Batch ]", () => {
  const setup = (options: { interval: number; maxSize?: number }) => {
    const deliver = vi.fn();
    const controller = createBatchDeliveryStrategy<number, { id: number }>(options)({ deliver });
    return { deliver, controller };
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should deliver all messages in order when the window closes", () => {
    const { deliver, controller } = setup({ interval: 100 });
    controller.push(message(1));
    controller.push(message(2));
    controller.push(message(3));
    expect(deliver).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(deliver).toHaveBeenCalledOnce();
    expect(deliver).toHaveBeenCalledWith({ data: [1, 2, 3], extra: { id: 3 } });
  });

  it("should measure the window from the first message", () => {
    const { deliver, controller } = setup({ interval: 100 });
    controller.push(message(1));
    vi.advanceTimersByTime(60);
    controller.push(message(2));
    vi.advanceTimersByTime(40); // t=100 since first
    expect(deliver).toHaveBeenCalledOnce();
    expect(deliver).toHaveBeenCalledWith({ data: [1, 2], extra: { id: 2 } });
  });

  it("should flush early at maxSize and cancel the timer", () => {
    const { deliver, controller } = setup({ interval: 100, maxSize: 2 });
    controller.push(message(1));
    controller.push(message(2));
    expect(deliver).toHaveBeenCalledOnce();
    expect(deliver).toHaveBeenCalledWith({ data: [1, 2], extra: { id: 2 } });
    vi.advanceTimersByTime(100);
    expect(deliver).toHaveBeenCalledOnce(); // the timer was cancelled, no empty batch
  });

  it("should open a new window after a flush", () => {
    const { deliver, controller } = setup({ interval: 100 });
    controller.push(message(1));
    vi.advanceTimersByTime(100);
    controller.push(message(2));
    expect(deliver).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(100);
    expect(deliver).toHaveBeenCalledTimes(2);
    expect(deliver).toHaveBeenLastCalledWith({ data: [2], extra: { id: 2 } });
  });

  it("should never deliver an empty batch", () => {
    const { deliver } = setup({ interval: 100 });
    vi.advanceTimersByTime(1000);
    expect(deliver).not.toHaveBeenCalled();
  });

  it("should drop the buffer on dispose", () => {
    const { deliver, controller } = setup({ interval: 100 });
    controller.push(message(1));
    controller.push(message(2));
    controller.dispose();
    controller.dispose(); // idempotent
    vi.advanceTimersByTime(500);
    expect(deliver).not.toHaveBeenCalled();
  });

  it("should ignore messages pushed after dispose", () => {
    const { deliver, controller } = setup({ interval: 100, maxSize: 1 });
    controller.dispose();
    controller.push(message(1));
    expect(deliver).not.toHaveBeenCalled();
  });

  it("should split a burst into ceil(n / maxSize) batches", () => {
    const { deliver, controller } = setup({ interval: 100, maxSize: 10 });
    for (let i = 1; i <= 25; i += 1) {
      controller.push(message(i));
    }
    expect(deliver).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(100);
    expect(deliver).toHaveBeenCalledTimes(3);
    expect(deliver.mock.calls.map(([{ data }]) => data.length)).toEqual([10, 10, 5]);
  });

  it("should allow disposing from inside the callback", () => {
    const deliver = vi.fn();
    const controller = createBatchDeliveryStrategy<number>({ interval: 100 })({
      deliver: (msg) => {
        deliver(msg);
        controller.dispose();
      },
    });
    controller.push(message(1));
    vi.advanceTimersByTime(100);
    controller.push(message(2));
    vi.advanceTimersByTime(100);
    expect(deliver).toHaveBeenCalledOnce();
  });

  it("should deliver every message immediately with maxSize 1", () => {
    const { deliver, controller } = setup({ interval: 100, maxSize: 1 });
    controller.push(message(1));
    controller.push(message(2));
    expect(deliver).toHaveBeenCalledTimes(2);
    expect(deliver.mock.calls.map(([m]) => m.data)).toEqual([[1], [2]]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("should flush exactly at the maxSize boundary", () => {
    const { deliver, controller } = setup({ interval: 100, maxSize: 3 });
    controller.push(message(1));
    controller.push(message(2));
    expect(deliver).not.toHaveBeenCalled();
    controller.push(message(3));
    expect(deliver).toHaveBeenCalledWith({ data: [1, 2, 3], extra: { id: 3 } });
    controller.push(message(4));
    controller.push(message(5));
    expect(deliver).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(100);
    expect(deliver).toHaveBeenLastCalledWith({ data: [4, 5], extra: { id: 5 } });
  });

  it("should keep a burst of 1000 messages in one ordered batch without maxSize", () => {
    const { deliver, controller } = setup({ interval: 100 });
    const expected: number[] = [];
    for (let i = 1; i <= 1000; i += 1) {
      controller.push(message(i));
      expected.push(i);
    }
    vi.advanceTimersByTime(100);
    expect(deliver).toHaveBeenCalledOnce();
    expect(deliver.mock.calls[0][0].data).toEqual(expected);
  });

  it("should deliver a fresh array for each batch", () => {
    const { deliver, controller } = setup({ interval: 100 });
    controller.push(message(1));
    vi.advanceTimersByTime(100);
    controller.push(message(2));
    vi.advanceTimersByTime(100);
    expect(deliver.mock.calls[0][0].data).not.toBe(deliver.mock.calls[1][0].data);
    expect(deliver.mock.calls[0][0].data).toEqual([1]);
    expect(deliver.mock.calls[1][0].data).toEqual([2]);
  });

  it("should keep working after the callback throws", () => {
    const deliver = vi.fn().mockImplementationOnce(() => {
      throw new Error("boom");
    });
    const controller = createBatchDeliveryStrategy<number>({ interval: 100 })({ deliver });
    controller.push(message(1));
    expect(() => vi.advanceTimersByTime(100)).toThrow("boom");
    controller.push(message(2));
    controller.push(message(3));
    vi.advanceTimersByTime(100);
    expect(deliver).toHaveBeenCalledTimes(2);
    expect(deliver).toHaveBeenLastCalledWith({ data: [2, 3], extra: { id: 3 } });
  });

  it("should not leak timers after dispose", () => {
    const { controller } = setup({ interval: 100 });
    controller.push(message(1));
    expect(vi.getTimerCount()).toBe(1);
    controller.dispose();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("should give independent buffers to controllers created from one factory", () => {
    const factory = createBatchDeliveryStrategy<number>({ interval: 100 });
    const first = vi.fn();
    const second = vi.fn();
    const a = factory({ deliver: first });
    const b = factory({ deliver: second });
    a.push(message(1));
    b.push(message(10));
    a.push(message(2));
    vi.advanceTimersByTime(100);
    expect(first).toHaveBeenCalledWith({ data: [1, 2], extra: { id: 2 } });
    expect(second).toHaveBeenCalledWith({ data: [10], extra: { id: 10 } });
  });

  it("should flush pending messages with interval 0 on the next macrotask", () => {
    const { deliver, controller } = setup({ interval: 0 });
    controller.push(message(1));
    controller.push(message(2));
    expect(deliver).not.toHaveBeenCalled();
    vi.advanceTimersByTime(0);
    expect(deliver).toHaveBeenCalledWith({ data: [1, 2], extra: { id: 2 } });
  });
});
