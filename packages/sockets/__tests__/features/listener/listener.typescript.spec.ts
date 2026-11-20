import type {
  ExtendListener,
  ListenerInstance,
  ListenerLifecycleOptionsType,
  ListenerModel,
  ListenerRequiresPayload,
  ListenMethodOptionsType,
} from "listener";
import { Socket } from "socket";
import type { ExtractListenerHasPayloadType, ExtractListenerPayloadType } from "types";
import { describe, expect, expectTypeOf, it } from "vitest";

const client = new Socket({
  url: "ws://localhost:3000",
});

type User = { data: string };
type RoomInput = { roomId: string; since?: Date };

const listenForUsers = client.createListener<User[]>()({
  topic: "/users",
});

const listenForUser = client.createListener<User>()({
  topic: "/users/:id",
});

const onRoomMessage = client.createListener<User, RoomInput>()({
  topic: "chat.onMessage",
});

const onOptionalInput = client.createListener<User, { cursor?: number } | undefined>()({
  topic: "feed.onItem",
});

describe("Listener [ Typescript ]", () => {
  describe("when listener has no payload", () => {
    it("should listen with the callback only", () => {
      expectTypeOf(listenForUsers.listen).parameter(1).toEqualTypeOf<ListenMethodOptionsType<undefined> | undefined>();
      expectTypeOf<ExtractListenerPayloadType<typeof listenForUsers>>().toEqualTypeOf<undefined>();
      expectTypeOf<ListenerRequiresPayload<typeof listenForUsers>>().toEqualTypeOf<false>();
      listenForUsers.listen(() => {});
      expect(true).toBeTrue();
    });

    it("should type the callback data with the response", () => {
      listenForUsers.listen(({ data }) => {
        expectTypeOf(data).toEqualTypeOf<User[]>();
      });
      expect(true).toBeTrue();
    });

    it("should keep params typed from the topic", () => {
      expectTypeOf(listenForUser.setParams).parameter(0).toEqualTypeOf<{ id: string | number }>();
      // @ts-expect-error unknown param
      listenForUser.setParams({ other: 1 });
      expect(true).toBeTrue();
    });
  });

  describe("when listener has a required payload", () => {
    it("should require the payload when it is not set", () => {
      expectTypeOf<ListenerRequiresPayload<typeof onRoomMessage>>().toEqualTypeOf<true>();
      expectTypeOf(onRoomMessage.listen)
        .parameter(1)
        .toEqualTypeOf<{ payload: RoomInput } & ListenerLifecycleOptionsType>();
      // @ts-expect-error payload is required
      onRoomMessage.listen(() => {});
      expect(true).toBeTrue();
    });

    it("should accept the payload as the listen option", () => {
      onRoomMessage.listen(() => {}, { payload: { roomId: "1" } });
      // @ts-expect-error wrong payload shape
      onRoomMessage.listen(() => {}, { payload: { room: "1" } });
      expect(true).toBeTrue();
    });

    it("should type setPayload with the payload", () => {
      expectTypeOf(onRoomMessage.setPayload).parameter(0).toEqualTypeOf<RoomInput>();
      // @ts-expect-error wrong payload shape
      onRoomMessage.setPayload({ id: 1 });
      expect(true).toBeTrue();
    });

    it("should not require the payload once it is set", () => {
      const withPayload = onRoomMessage.setPayload({ roomId: "1" });
      expectTypeOf<ExtractListenerHasPayloadType<typeof withPayload>>().toEqualTypeOf<true>();
      expectTypeOf<ListenerRequiresPayload<typeof withPayload>>().toEqualTypeOf<false>();
      withPayload.listen(() => {});
      expect(true).toBeTrue();
    });

    it("should keep the payload state through other setters", () => {
      const withPayload = onRoomMessage.setPayload({ roomId: "1" }).setOptions(undefined);
      expectTypeOf<ExtractListenerHasPayloadType<typeof withPayload>>().toEqualTypeOf<true>();
      const withoutPayload = onRoomMessage.setOptions(undefined);
      expectTypeOf<ExtractListenerHasPayloadType<typeof withoutPayload>>().toEqualTypeOf<false>();
      expect(true).toBeTrue();
    });
  });

  describe("when listener has an optional payload", () => {
    it("should listen without the payload", () => {
      expectTypeOf<ListenerRequiresPayload<typeof onOptionalInput>>().toEqualTypeOf<false>();
      onOptionalInput.listen(() => {});
      onOptionalInput.listen(() => {}, { payload: { cursor: 1 } });
      expect(true).toBeTrue();
    });
  });

  describe("when using the listener type helpers", () => {
    it("should model the payload in ListenerModel", () => {
      type Model = ListenerModel<{ response: User; payload: RoomInput; topic: "chat.onMessage" }>;
      expectTypeOf<ExtractListenerPayloadType<Model>>().toEqualTypeOf<RoomInput>();
      expectTypeOf<ExtractListenerHasPayloadType<Model>>().toEqualTypeOf<false>();
      expectTypeOf<ListenerRequiresPayload<Model>>().toEqualTypeOf<true>();
      expect(true).toBeTrue();
    });

    it("should default the ListenerModel payload to undefined", () => {
      type Model = ListenerModel<{ response: User; topic: "users" }>;
      expectTypeOf<ExtractListenerPayloadType<Model>>().toEqualTypeOf<undefined>();
      expectTypeOf<ListenerRequiresPayload<Model>>().toEqualTypeOf<false>();
      expect(true).toBeTrue();
    });

    it("should accept every listener as a ListenerInstance", () => {
      expectTypeOf(onRoomMessage).toMatchTypeOf<ListenerInstance>();
      expectTypeOf(onRoomMessage.setPayload({ roomId: "1" })).toMatchTypeOf<ListenerInstance>();
      expectTypeOf(listenForUsers).toMatchTypeOf<ListenerInstance>();
      expectTypeOf(onRoomMessage).toMatchTypeOf<ListenerInstance<{ payload: RoomInput }>>();
      expect(true).toBeTrue();
    });

    it("should not require the payload of an erased listener", () => {
      expectTypeOf<ListenerRequiresPayload<ListenerInstance>>().toEqualTypeOf<false>();
      expect(true).toBeTrue();
    });

    it("should extend the payload with ExtendListener", () => {
      type Extended = ExtendListener<typeof listenForUsers, { payload: RoomInput; hasPayload: true }>;
      expectTypeOf<ExtractListenerPayloadType<Extended>>().toEqualTypeOf<RoomInput>();
      expectTypeOf<ExtractListenerHasPayloadType<Extended>>().toEqualTypeOf<true>();
      expect(true).toBeTrue();
    });
  });
});
