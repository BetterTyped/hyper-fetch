import { Socket } from "socket";
import { expectTypeOf } from "vitest";

const socket = new Socket({ url: "ws://params", adapterOptions: { autoConnect: false } });

describe("Listener [ Params ]", () => {
  describe("When setting params on a listener", () => {
    it("should fill a single param", () => {
      const listener = socket.createListener<string>()({ topic: "chat/:roomId" }).setParams({ roomId: 1 });

      expect(listener.topic).toBe("chat/1");
      expect(listener.params).toStrictEqual({ roomId: 1 });
    });

    it("should fill many params", () => {
      const listener = socket
        .createListener<string>()({ topic: "orgs/:orgId/rooms/:roomId/users/:userId" })
        .setParams({ orgId: "acme", roomId: 2, userId: "ann" });

      expect(listener.topic).toBe("orgs/acme/rooms/2/users/ann");
    });

    it("should not change the listener used as a template", () => {
      const template = socket.createListener<string>()({ topic: "chat/:roomId" });

      template.setParams({ roomId: 1 });

      expect(template.topic).toBe("chat/:roomId");
      expect(template.params).toBeUndefined();
    });

    it("should replace the params when they are set again", () => {
      const first = socket.createListener<string>()({ topic: "chat/:roomId" }).setParams({ roomId: 1 });
      const second = first.setParams({ roomId: 2 });

      expect(first.topic).toBe("chat/1");
      expect(second.topic).toBe("chat/2");
      expect(second.params).toStrictEqual({ roomId: 2 });
    });

    it("should keep the params through setOptions, setDelivery and clone", () => {
      const listener = socket.createListener<string>()({ topic: "chat/:roomId" }).setParams({ roomId: 1 });

      expect(listener.setOptions(undefined).topic).toBe("chat/1");
      expect(listener.setDelivery({ strategy: "latest", interval: 10 }).topic).toBe("chat/1");
      expect(listener.clone().topic).toBe("chat/1");
      expect(listener.clone().params).toStrictEqual({ roomId: 1 });
    });

    it("should allow new params after other methods cloned the listener", () => {
      const listener = socket
        .createListener<string>()({ topic: "chat/:roomId" })
        .setParams({ roomId: 1 })
        .setDelivery({ strategy: "batch", interval: 10 })
        .setParams({ roomId: 2 });

      expect(listener.topic).toBe("chat/2");
      expect(listener.delivery).toStrictEqual({ strategy: "batch", interval: 10 });
    });

    it("should not let a short param name replace the beginning of a longer one", () => {
      const listener = socket.createListener<string>()({ topic: "items/:id/:idx" }).setParams({ id: 1, idx: 2 });

      expect(listener.topic).toBe("items/1/2");
    });

    it("should insert values with replacement patterns literally", () => {
      const listener = socket.createListener<string>()({ topic: "files/:name" }).setParams({ name: "a$&b$1" });

      expect(listener.topic).toBe("files/a$&b$1");
    });

    it("should not parse a value containing a colon as another param", () => {
      const listener = socket.createListener<string>()({ topic: ":first/:second" }).setParams({
        first: ":second",
        second: "value",
      });

      expect(listener.topic).toBe(":second/value");
    });

    it.each([
      { value: 0, topic: "items/0" },
      { value: "", topic: "items/" },
      { value: false, topic: "items/false" },
    ])("should fill the falsy value $value", ({ value, topic }) => {
      const listener = socket
        .createListener<string>()({ topic: "items/:id" })
        .setParams({ id: value as any });

      expect(listener.topic).toBe(topic);
    });

    it("should leave params without a value untouched", () => {
      const listener = socket
        .createListener<string>()({ topic: "a/:first/:second" })
        .setParams({ first: 1 } as any);

      expect(listener.topic).toBe("a/1/:second");
    });

    it("should listen on separate topics for separate params", () => {
      const template = socket.createListener<string>()({ topic: "chat/:roomId" });
      const first = vi.fn();
      const second = vi.fn();
      const stopFirst = template.setParams({ roomId: 1 }).listen(({ data }) => first(data));
      const stopSecond = template.setParams({ roomId: 2 }).listen(({ data }) => second(data));

      socket.adapter.triggerListeners({ topic: "chat/1", data: "one", extra: {} as any });
      socket.adapter.triggerListeners({ topic: "chat/2", data: "two", extra: {} as any });

      expect(first.mock.calls).toStrictEqual([["one"]]);
      expect(second.mock.calls).toStrictEqual([["two"]]);
      stopFirst();
      stopSecond();
    });
  });

  describe("When setting params on an emitter", () => {
    it("should replace the params when they are set again", () => {
      const emitter = socket.createEmitter<string>()({ topic: "chat/:roomId" }).setParams({ roomId: 1 });

      expect(emitter.topic).toBe("chat/1");
      expect(emitter.setParams({ roomId: 2 }).topic).toBe("chat/2");
    });

    it("should not let a short param name replace the beginning of a longer one", () => {
      const emitter = socket.createEmitter<string>()({ topic: "items/:id/:idx" }).setParams({ id: 1, idx: 2 });

      expect(emitter.topic).toBe("items/1/2");
    });

    it("should insert values with replacement patterns literally", () => {
      const emitter = socket.createEmitter<string>()({ topic: "files/:name" }).setParams({ name: "a$&b" });

      expect(emitter.topic).toBe("files/a$&b");
    });

    it("should keep the params through setPayload and setOptions", () => {
      const emitter = socket
        .createEmitter<string>()({ topic: "chat/:roomId" })
        .setParams({ roomId: 1 })
        .setPayload("hi")
        .setOptions(undefined);

      expect(emitter.topic).toBe("chat/1");
      expect(emitter.payload).toBe("hi");
      expect(emitter.params).toStrictEqual({ roomId: 1 });
    });
  });

  describe("When checking the types", () => {
    it("should type the params from the topic", () => {
      const listener = socket.createListener<string>()({ topic: "orgs/:orgId/rooms/:roomId" });
      const emitter = socket.createEmitter<string>()({ topic: "orgs/:orgId/rooms/:roomId" });

      expectTypeOf(listener.setParams).parameter(0).toHaveProperty("orgId");
      expectTypeOf(listener.setParams).parameter(0).toHaveProperty("roomId");
      expectTypeOf(emitter.setParams).parameter(0).toHaveProperty("orgId");
      expectTypeOf(emitter.setParams).parameter(0).toHaveProperty("roomId");
      // @ts-expect-error - unknown param
      listener.setParams({ orgId: 1, roomId: 1, other: 1 });
      // @ts-expect-error - missing param
      emitter.setParams({ orgId: 1 });
    });

    it("should keep the topic literal and the data types through the methods", () => {
      const listener = socket.createListener<{ text: string }>()({ topic: "chat/:roomId" }).setParams({ roomId: 1 });
      const emitter = socket.createEmitter<{ text: string }>()({ topic: "chat/:roomId" }).setParams({ roomId: 1 });

      expectTypeOf(listener.topic).toEqualTypeOf<"chat/:roomId">();
      expectTypeOf(emitter.topic).toEqualTypeOf<"chat/:roomId">();
      listener.listen(({ data, extra }) => {
        expectTypeOf(data).toEqualTypeOf<{ text: string }>();
        expectTypeOf(extra).toEqualTypeOf<MessageEvent<any>>();
      })();
      expectTypeOf(emitter.setPayload).parameter(0).toExtend<{ text: string }>();
    });

    it("should require the payload and the params only when they are missing", () => {
      const emitter = socket.createEmitter<{ text: string }>()({ topic: "chat/:roomId" });
      const ready = emitter.setParams({ roomId: 1 }).setPayload({ text: "hi" });

      expectTypeOf(ready.emit).toBeCallableWith();
      expectTypeOf(emitter.emit).toBeCallableWith({ payload: { text: "hi" }, params: { roomId: 1 } });
      // @ts-expect-error - payload has a wrong shape
      expectTypeOf(emitter.emit).toBeCallableWith({ payload: { text: 1 }, params: { roomId: 1 } });
      // @ts-expect-error - payload and params are required
      expectTypeOf(emitter.emit).toBeCallableWith();
    });
  });
});
