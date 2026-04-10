import { EventEmitter } from "utils/emitter.utils";

describe("EventEmitter [ Utils ]", () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  describe("When using emit with isTriggeredExternally", () => {
    it("should emit with isTriggeredExternally=true and pass the flag to listeners", () => {
      const spy = jest.fn();
      emitter.on("test-event", spy);

      emitter.emit("test-event", { foo: "bar" }, true);

      expect(spy).toHaveBeenCalledWith({ foo: "bar" }, true);
    });

    it("should emit without isTriggeredExternally flag when false", () => {
      const spy = jest.fn();
      emitter.on("test-event", spy);

      emitter.emit("test-event", { foo: "bar" }, false);

      expect(spy).toHaveBeenCalledWith({ foo: "bar" });
    });
  });

  describe("When using onEmit", () => {
    it("should register a callback that fires on every emit", () => {
      const callback = jest.fn();
      emitter.onEmit(callback);

      emitter.emit("some-event", "some-data", false);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith("some-event", "some-data");
    });

    it("should pass isTriggeredExternally to onEmit callback when true", () => {
      const callback = jest.fn();
      emitter.onEmit(callback);

      emitter.emit("some-event", "some-data", true);

      expect(callback).toHaveBeenCalledWith("some-event", "some-data", true);
    });

    it("should support multiple onEmit callbacks", () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      emitter.onEmit(callback1);
      emitter.onEmit(callback2);

      emitter.emit("event", "data", false);

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it("should return a cleanup function that removes the callback", () => {
      const callback = jest.fn();
      const cleanup = emitter.onEmit(callback);

      emitter.emit("event", "data", false);
      expect(callback).toHaveBeenCalledTimes(1);

      cleanup();

      emitter.emit("event", "data2", false);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should only remove the specific callback when cleanup is called", () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const cleanup1 = emitter.onEmit(callback1);
      emitter.onEmit(callback2);

      cleanup1();

      emitter.emit("event", "data", false);
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });
});
