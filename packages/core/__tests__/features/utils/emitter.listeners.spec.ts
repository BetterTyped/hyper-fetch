import { HttpMethods, SAFE_HTTP_METHODS } from "constants/http.constants";
import { Time } from "constants/time.constants";
import { EventEmitter, getUniqueRequestId } from "utils";

describe("EventEmitter [ Listeners ]", () => {
  let emitter = new EventEmitter();

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  describe("When the listeners are counted", () => {
    it("should report the number of the listeners when they are added and removed", () => {
      const counts: number[] = [];
      const first = () => {};
      const second = () => {};
      emitter.onListener("event", (count) => counts.push(count));

      emitter.on("event", first);
      emitter.on("event", second);
      emitter.off("event", first);
      emitter.off("event", second);

      expect(counts).toStrictEqual([1, 2, 1, 0]);
    });

    it("should report the listeners managed with the aliases", () => {
      const counts: number[] = [];
      const listener = () => {};
      emitter.onListener("event", (count) => counts.push(count));

      emitter.addListener("event", listener);
      emitter.removeListener("event", listener);

      expect(counts).toStrictEqual([1, 0]);
    });

    it("should report only the listeners of the observed event", () => {
      const spy = vi.fn();
      emitter.onListener("event", spy);

      emitter.on("other", () => {});

      expect(spy).not.toHaveBeenCalled();
    });

    it("should stop reporting after the observer is removed", () => {
      const spy = vi.fn();
      const unsubscribe = emitter.onListener("event", spy);

      unsubscribe();
      emitter.on("event", () => {});

      expect(spy).not.toHaveBeenCalled();
    });

    it("should report the removal of the listener which was called once", () => {
      const counts: number[] = [];
      const spy = vi.fn();
      emitter.onListener("event", (count) => counts.push(count));

      emitter.once("event", spy);
      emitter.emit("event", "data", false);
      emitter.emit("event", "data", false);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(counts).toStrictEqual([1, 0]);
    });

    it("should return the emitter from the on and off methods", () => {
      const listener = () => {};

      expect(emitter.on("event", listener)).toBe(emitter);
      expect(emitter.off("event", listener)).toBe(emitter);
    });
  });

  describe("When the events are emitted", () => {
    it("should tell whether the event had any listeners", () => {
      expect(emitter.emit("event", "data", false)).toBeFalse();

      emitter.on("event", () => {});

      expect(emitter.emit("event", "data", false)).toBeTrue();
    });

    it("should call the listeners in the order they were added", () => {
      const order: number[] = [];
      emitter.on("event", () => order.push(1));
      emitter.on("event", () => order.push(2));
      emitter.on("event", () => order.push(3));

      emitter.emit("event", "data", false);

      expect(order).toStrictEqual([1, 2, 3]);
    });

    it("should call the emit observers before the listeners", () => {
      const order: string[] = [];
      emitter.on("event", () => order.push("listener"));
      emitter.onEmit(() => order.push("observer"));

      emitter.emit("event", "data", false);

      expect(order).toStrictEqual(["observer", "listener"]);
    });

    it("should call the emit observers for the events without listeners", () => {
      const spy = vi.fn();
      emitter.onEmit(spy);

      emitter.emit("event", { id: 1 }, false);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith("event", { id: 1 });
    });

    it("should call the remaining listeners when one of them removes itself during the emit", () => {
      const spy = vi.fn();
      const selfRemoving = () => emitter.off("event", selfRemoving);
      emitter.on("event", selfRemoving);
      emitter.on("event", spy);

      emitter.emit("event", "data", false);
      emitter.emit("event", "data", false);

      expect(spy).toHaveBeenCalledTimes(2);
      expect(emitter.listenerCount("event")).toBe(1);
    });

    it("should not call the listeners of other events", () => {
      const spy = vi.fn();
      emitter.on("other", spy);

      emitter.emit("event", "data", false);

      expect(spy).not.toHaveBeenCalled();
    });

    it("should remove every listener at once", () => {
      const spy = vi.fn();
      emitter.on("event", spy);
      emitter.on("other", spy);

      emitter.removeAllListeners();
      emitter.emit("event", "data", false);
      emitter.emit("other", "data", false);

      expect(spy).not.toHaveBeenCalled();
      expect(emitter.eventNames()).toHaveLength(0);
    });

    it("should not share the listeners between the emitters", () => {
      const spy = vi.fn();
      const other = new EventEmitter();
      other.on("event", spy);
      other.onEmit(spy);

      emitter.emit("event", "data", false);

      expect(spy).not.toHaveBeenCalled();
    });
  });
});

describe("Utils [ Request Id ]", () => {
  it("should start the request id with the query key", () => {
    expect(getUniqueRequestId({ queryKey: "GET_/users" }).startsWith("GET_/users_")).toBeTrue();
  });

  it("should generate a different id with every call", () => {
    const ids = new Set(Array.from({ length: 2000 }, () => getUniqueRequestId({ queryKey: "key" })));

    expect(ids.size).toBe(2000);
  });

  it("should generate the ids for the empty query key", () => {
    expect(getUniqueRequestId({ queryKey: "" })).toMatch(/^_[0-9a-z]+_[0-9a-z]+$/);
  });
});

describe("Constants [ Values ]", () => {
  it("should define the time units in milliseconds", () => {
    expect(Time.SEC).toBe(1000);
    expect(Time.MIN).toBe(60 * Time.SEC);
    expect(Time.HOUR).toBe(60 * Time.MIN);
    expect(Time.DAY).toBe(24 * Time.HOUR);
    expect(Time.WEEK).toBe(7 * Time.DAY);
    expect(Time.MONTH_30).toBe(30 * Time.DAY);
    expect(Time.MONTH_31).toBe(31 * Time.DAY);
    expect(Time.YEAR).toBe(365 * Time.DAY);
    expect(Time.YEAR_LEAP).toBe(366 * Time.DAY);
  });

  it("should define the http methods by their names", () => {
    Object.entries(HttpMethods).forEach(([name, value]) => expect(value).toBe(name));
  });

  it("should treat only the reading methods as safe", () => {
    expect(SAFE_HTTP_METHODS).toStrictEqual(["GET", "QUERY"]);
  });
});
