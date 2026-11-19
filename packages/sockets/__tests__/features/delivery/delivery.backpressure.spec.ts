import { createBatchDeliveryStrategy, createDeliveryStrategy, createLatestDeliveryStrategy } from "delivery";
import { Socket } from "socket";

type Tick = { id: number };

/** Pushes messages straight into the adapter - the same path a transport uses, without any network */
const createStream = (socket: Socket, topic: string) => {
  return (id: number) => socket.adapter.triggerListeners({ topic, data: { id }, extra: { id } as any });
};

describe("Delivery [ Back-pressure ]", () => {
  let socket: Socket;

  beforeEach(() => {
    socket = new Socket({ url: "ws://delivery", adapterOptions: { autoConnect: false } });
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("When batching a fast stream", () => {
    it("should deliver 10000 messages of one window as a single ordered batch", () => {
      const listener = socket.createListener<Tick>()({
        topic: "ticks",
        delivery: { strategy: "batch", interval: 100 },
      });
      const push = createStream(socket, "ticks");
      const batches: Tick[][] = [];
      listener.listen(({ data }) => batches.push(data));

      for (let i = 0; i < 10_000; i += 1) {
        push(i);
      }
      expect(batches).toHaveLength(0);
      vi.advanceTimersByTime(100);

      expect(batches).toHaveLength(1);
      expect(batches[0]).toHaveLength(10_000);
      expect(batches[0].every((tick, index) => tick.id === index)).toBeTrue();
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should split a long stream into windows without losing or reordering messages", () => {
      const listener = socket.createListener<Tick>()({
        topic: "ticks",
        delivery: { strategy: "batch", interval: 100 },
      });
      const push = createStream(socket, "ticks");
      const batches: Tick[][] = [];
      listener.listen(({ data }) => batches.push(data));

      // 5000 messages, one every 1ms
      for (let i = 0; i < 5000; i += 1) {
        push(i);
        vi.advanceTimersByTime(1);
      }
      vi.advanceTimersByTime(100);

      expect(batches).toHaveLength(50);
      expect(batches.every((batch) => batch.length === 100)).toBeTrue();
      expect(batches.flat().every((tick, index) => tick.id === index)).toBeTrue();
    });

    it("should flush early every time the max size is reached", () => {
      const listener = socket.createListener<Tick>()({
        topic: "ticks",
        delivery: { strategy: "batch", interval: 1000, maxSize: 250 },
      });
      const push = createStream(socket, "ticks");
      const sizes: number[] = [];
      listener.listen(({ data }) => sizes.push(data.length));

      for (let i = 0; i < 1100; i += 1) {
        push(i);
      }
      expect(sizes).toStrictEqual([250, 250, 250, 250]);

      vi.advanceTimersByTime(1000);
      expect(sizes).toStrictEqual([250, 250, 250, 250, 100]);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should pass the extra of the last message of the batch", () => {
      const listener = socket.createListener<Tick>()({
        topic: "ticks",
        delivery: { strategy: "batch", interval: 100 },
      });
      const push = createStream(socket, "ticks");
      const extras: unknown[] = [];
      listener.listen(({ extra }) => extras.push(extra));

      push(1);
      push(2);
      push(3);
      vi.advanceTimersByTime(100);

      expect(extras).toStrictEqual([{ id: 3 }]);
    });

    it("should not open a window when no message arrives", () => {
      const listener = socket.createListener<Tick>()({
        topic: "ticks",
        delivery: { strategy: "batch", interval: 100 },
      });
      const spy = vi.fn();
      listener.listen(spy);

      vi.advanceTimersByTime(1000);

      expect(spy).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe("When sampling a fast stream", () => {
    it("should deliver the first message at once and the newest one per window", () => {
      const listener = socket.createListener<Tick>()({
        topic: "ticks",
        delivery: { strategy: "latest", interval: 100 },
      });
      const push = createStream(socket, "ticks");
      const delivered: number[] = [];
      listener.listen(({ data }) => delivered.push(data.id));

      for (let i = 0; i < 10_000; i += 1) {
        push(i);
      }
      expect(delivered).toStrictEqual([0]);

      vi.advanceTimersByTime(100);
      expect(delivered).toStrictEqual([0, 9999]);
    });

    it("should deliver at most one message per window for a continuous stream", () => {
      const listener = socket.createListener<Tick>()({
        topic: "ticks",
        delivery: { strategy: "latest", interval: 100 },
      });
      const push = createStream(socket, "ticks");
      const delivered: number[] = [];
      listener.listen(({ data }) => delivered.push(data.id));

      // 3000 messages, one every 1ms - 3 seconds of traffic
      for (let i = 0; i < 3000; i += 1) {
        push(i);
        vi.advanceTimersByTime(1);
      }

      expect(delivered).toHaveLength(31);
      expect(delivered[0]).toBe(0);
      expect(delivered.every((id, index) => index === 0 || id > delivered[index - 1])).toBeTrue();
    });

    it("should end on the newest message and go idle", () => {
      const listener = socket.createListener<Tick>()({
        topic: "ticks",
        delivery: { strategy: "latest", interval: 100 },
      });
      const push = createStream(socket, "ticks");
      const delivered: number[] = [];
      listener.listen(({ data }) => delivered.push(data.id));

      push(1);
      push(2);
      push(3);
      vi.advanceTimersByTime(1000);

      expect(delivered).toStrictEqual([1, 3]);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should wait for the window before the first delivery without leading", () => {
      const listener = socket.createListener<Tick>()({
        topic: "ticks",
        delivery: { strategy: "latest", interval: 100, leading: false },
      });
      const push = createStream(socket, "ticks");
      const delivered: number[] = [];
      listener.listen(({ data }) => delivered.push(data.id));

      push(1);
      push(2);
      expect(delivered).toStrictEqual([]);

      vi.advanceTimersByTime(100);
      expect(delivered).toStrictEqual([2]);
    });
  });

  describe("When the subscription ends", () => {
    it.each([
      { name: "batch", delivery: { strategy: "batch", interval: 100 } as const },
      { name: "latest", delivery: { strategy: "latest", interval: 100 } as const },
    ])("should drop pending $name messages and clear the timer on unsubscribe", ({ delivery }) => {
      const listener = socket.createListener<Tick>()({ topic: "ticks", delivery });
      const push = createStream(socket, "ticks");
      const spy = vi.fn();
      const stop = listener.listen(spy);
      push(1);
      push(2);
      spy.mockClear();

      stop();
      vi.advanceTimersByTime(1000);

      expect(spy).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should allow unsubscribing inside the callback of a flushed batch", () => {
      const listener = socket.createListener<Tick>()({
        topic: "ticks",
        delivery: { strategy: "batch", interval: 100 },
      });
      const push = createStream(socket, "ticks");
      const batches: Tick[][] = [];
      const stop = listener.listen(({ data }) => {
        batches.push(data);
        stop();
      });

      push(1);
      vi.advanceTimersByTime(100);
      push(2);
      vi.advanceTimersByTime(100);

      expect(batches).toStrictEqual([[{ id: 1 }]]);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should allow unsubscribing inside the callback of a sampled message", () => {
      const listener = socket.createListener<Tick>()({
        topic: "ticks",
        delivery: { strategy: "latest", interval: 100 },
      });
      const push = createStream(socket, "ticks");
      const delivered: number[] = [];
      const stop = listener.listen(({ data }) => {
        delivered.push(data.id);
        if (data.id === 2) {
          stop();
        }
      });

      push(1);
      push(2);
      vi.advanceTimersByTime(100);
      push(3);
      vi.advanceTimersByTime(1000);

      expect(delivered).toStrictEqual([1, 2]);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should keep the buffers of other subscriptions when one ends", () => {
      const listener = socket.createListener<Tick>()({
        topic: "ticks",
        delivery: { strategy: "batch", interval: 100 },
      });
      const push = createStream(socket, "ticks");
      const first = vi.fn();
      const second = vi.fn();
      const stopFirst = listener.listen(({ data }) => first(data));
      listener.listen(({ data }) => second(data));

      push(1);
      stopFirst();
      push(2);
      vi.advanceTimersByTime(100);

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }]);
    });

    it("should be safe to dispose a strategy many times", () => {
      const deliver = vi.fn();
      const batch = createBatchDeliveryStrategy<Tick>({ interval: 100 })({ deliver });
      const latest = createLatestDeliveryStrategy<Tick>({ interval: 100 })({ deliver });

      batch.push({ data: { id: 1 }, extra: null });
      latest.push({ data: { id: 1 }, extra: null });
      deliver.mockClear();
      batch.dispose();
      batch.dispose();
      latest.dispose();
      latest.dispose();
      batch.push({ data: { id: 2 }, extra: null });
      latest.push({ data: { id: 2 }, extra: null });
      vi.advanceTimersByTime(1000);

      expect(deliver).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should dispose a custom strategy once per subscription", () => {
      const dispose = vi.fn();
      const strategy = createDeliveryStrategy<Tick>(({ deliver }) => ({ push: deliver, dispose }));
      const listener = socket.createListener<Tick>()({ topic: "ticks", delivery: strategy });
      const stopFirst = listener.listen(() => null);
      const stopSecond = listener.listen(() => null);

      stopFirst();
      stopSecond();

      expect(dispose).toHaveBeenCalledTimes(2);
    });
  });

  describe("When many subscriptions share a stream", () => {
    it("should keep a separate window for every subscription", () => {
      const listener = socket.createListener<Tick>()({
        topic: "ticks",
        delivery: { strategy: "batch", interval: 100 },
      });
      const push = createStream(socket, "ticks");
      const early: Tick[][] = [];
      const late: Tick[][] = [];
      listener.listen(({ data }) => early.push(data));

      push(1);
      vi.advanceTimersByTime(50);
      listener.listen(({ data }) => late.push(data));
      push(2);
      vi.advanceTimersByTime(50);

      expect(early).toStrictEqual([[{ id: 1 }, { id: 2 }]]);
      expect(late).toStrictEqual([]);

      vi.advanceTimersByTime(50);
      expect(late).toStrictEqual([[{ id: 2 }]]);
    });

    it("should serve differently configured listeners of one topic from the same messages", () => {
      const push = createStream(socket, "ticks");
      const raw: number[] = [];
      const sampled: number[] = [];
      const batched: number[][] = [];
      socket
        .createListener<Tick>()({ topic: "ticks" })
        .listen(({ data }) => raw.push(data.id));
      socket
        .createListener<Tick>()({ topic: "ticks", delivery: { strategy: "latest", interval: 100 } })
        .listen(({ data }) => sampled.push(data.id));
      socket
        .createListener<Tick>()({ topic: "ticks", delivery: { strategy: "batch", interval: 100 } })
        .listen(({ data }) => batched.push(data.map((tick) => tick.id)));

      for (let i = 0; i < 100; i += 1) {
        push(i);
      }
      vi.advanceTimersByTime(100);

      expect(raw).toHaveLength(100);
      expect(sampled).toStrictEqual([0, 99]);
      expect(batched).toHaveLength(1);
      expect(batched[0]).toHaveLength(100);
    });

    it("should handle a thousand batching subscriptions with one timer each", () => {
      const listener = socket.createListener<Tick>()({
        topic: "ticks",
        delivery: { strategy: "batch", interval: 100 },
      });
      const push = createStream(socket, "ticks");
      const spy = vi.fn();
      const stops = Array.from({ length: 1000 }, () => listener.listen(spy));

      push(1);
      push(2);
      expect(vi.getTimerCount()).toBe(1000);

      vi.advanceTimersByTime(100);
      expect(spy).toHaveBeenCalledTimes(1000);

      stops.forEach((stop) => stop());
      expect(vi.getTimerCount()).toBe(0);
      expect(socket.adapter.listeners.get("ticks")?.size).toBe(0);
    });
  });
});
