import { Socket } from "@hyper-fetch/sockets";
import gql from "graphql-tag";

import type { GraphqlWsAdapterOptionsType, GraphqlWsExtraType } from "../../../src";
import { GraphqlSubscriptionError, GraphqlWsAdapter } from "../../../src";
import {
  acknowledgeWebSocket,
  flushPromises,
  installControlledWebSocket,
  openWebSocket,
  uninstallControlledWebSocket,
} from "../../utils/controlled-websocket";

type Message = { onMessage: { text: string } };
type MessageVariables = { room: string };
type Event<T> = { data: T; extra: GraphqlWsExtraType };

const url = "ws://localhost:4000/graphql";

const onMessageDocument = gql`
  subscription OnMessage($room: String!) {
    onMessage(room: $room) {
      text
    }
  }
`;
const onMessageQuery = `subscription OnMessage($room: String!) {
  onMessage(room: $room) {
    text
  }
}`;

const createSocket = (adapterOptions?: GraphqlWsAdapterOptionsType) => {
  const socket = new Socket({
    url,
    adapter: GraphqlWsAdapter(),
    adapterOptions: adapterOptions ?? { autoConnect: false },
    reconnectTime: 100,
  });
  const errors: Error[] = [];
  socket.onError(({ error }) => {
    errors.push(error as Error);
  });
  const onMessage = socket.createListener<Message, MessageVariables>()({
    topic: "OnMessage",
    options: { document: onMessageDocument },
  });
  const onTick = socket.createListener<{ tick: number }>()({ topic: "subscription OnTick { tick }" });
  return { socket, errors, onMessage, onTick };
};

describe("Graphql Ws Adapter [ Subscriptions ]", () => {
  // The lower end of the reconnection jitter - every delay is exactly `reconnectTime`
  let random = vi.spyOn(Math, "random");
  let setup = createSocket();

  const connect = async (current = setup) => {
    current.socket.connect();
    return acknowledgeWebSocket();
  };

  beforeEach(() => {
    random = vi.spyOn(Math, "random").mockReturnValue(0);
    installControlledWebSocket();
    setup = createSocket();
  });

  afterEach(async () => {
    await setup.socket.disconnect();
    vi.useRealTimers();
    uninstallControlledWebSocket();
    random.mockRestore();
  });

  describe("when starting a subscription", () => {
    it("should send the document, the operation name and the variables", async () => {
      const ws = await connect();

      setup.onMessage.setPayload({ room: "a" }).listen(vi.fn());

      expect(ws.subscriptions).toStrictEqual([
        {
          id: "1",
          type: "subscribe",
          payload: { query: onMessageQuery, operationName: "OnMessage", variables: { room: "a" } },
        },
      ]);
    });

    it("should send the topic as the document when the document option is omitted", async () => {
      const ws = await connect();

      setup.onTick.listen(vi.fn());

      expect(ws.subscriptions).toStrictEqual([
        { id: "1", type: "subscribe", payload: { query: "subscription OnTick { tick }", operationName: "OnTick" } },
      ]);
    });

    it("should send no operation name for an anonymous document", async () => {
      const ws = await connect();

      setup.socket.createListener<{ tick: number }>()({ topic: "subscription { tick }" }).listen(vi.fn());

      expect(ws.lastSubscription.payload).toStrictEqual({ query: "subscription { tick }" });
    });

    it("should send the subscriptions only after the server acknowledged the connection", async () => {
      setup.onMessage.setPayload({ room: "a" }).listen(vi.fn());
      setup.socket.connect();
      const ws = await openWebSocket();

      expect(ws.messages).toStrictEqual([{ type: "connection_init" }]);

      ws.serverAck();
      await flushPromises();

      expect(ws.subscriptions).toHaveLength(1);
    });

    it("should share one server subscription between the listeners of the same variables", async () => {
      const ws = await connect();
      const first = vi.fn();
      const second = vi.fn();

      const stopFirst = setup.onMessage.setPayload({ room: "a" }).listen(first);
      const stopSecond = setup.onMessage.listen(second, { payload: { room: "a" } });
      ws.serverNext("1", { data: { onMessage: { text: "hi" } } });

      expect(ws.subscriptions).toHaveLength(1);
      expect(first).toHaveBeenCalledTimes(1);
      expect(second).toHaveBeenCalledTimes(1);

      stopFirst();
      expect(ws.completed).toStrictEqual([]);
      stopSecond();
      expect(ws.completed).toStrictEqual(["1"]);
    });

    it("should keep the events of different variables apart", async () => {
      const ws = await connect();
      const roomA = vi.fn();
      const roomB = vi.fn();

      setup.onMessage.setPayload({ room: "a" }).listen(roomA);
      setup.onMessage.setPayload({ room: "b" }).listen(roomB);
      ws.serverNext("2", { data: { onMessage: { text: "for b" } } });

      expect(ws.subscriptions.map(({ payload }) => payload.variables)).toStrictEqual([{ room: "a" }, { room: "b" }]);
      expect(roomA).not.toHaveBeenCalled();
      expect(roomB).toHaveBeenCalledWith({
        data: { onMessage: { text: "for b" } },
        extra: { errors: undefined, extensions: {}, payload: { room: "b" } },
      });
    });

    it("should keep documents with the same topic apart", async () => {
      const ws = await connect();
      const withText = vi.fn();
      const withAuthor = vi.fn();
      const authorDocument = gql`
        subscription OnMessage($room: String!) {
          onMessage(room: $room) {
            author
          }
        }
      `;

      setup.onMessage.setPayload({ room: "a" }).listen(withText);
      setup.onMessage.setOptions({ document: authorDocument }).setPayload({ room: "a" }).listen(withAuthor);
      ws.serverNext("2", { data: { onMessage: { author: "Ann" } } });

      expect(ws.subscriptions).toHaveLength(2);
      expect(withText).not.toHaveBeenCalled();
      expect(withAuthor).toHaveBeenCalledTimes(1);
    });

    it("should never reuse an id", async () => {
      const ws = await connect();

      const stop = setup.onMessage.setPayload({ room: "a" }).listen(vi.fn());
      stop();
      setup.onMessage.setPayload({ room: "a" }).listen(vi.fn());

      expect(ws.subscriptions.map(({ id }) => id)).toStrictEqual(["1", "2"]);
    });

    it("should start the listener once the subscription is sent", async () => {
      const onStart = vi.fn();
      setup.onMessage.setPayload({ room: "a" }).listen(vi.fn(), { onStart });
      setup.socket.connect();
      const ws = await openWebSocket();

      expect(onStart).not.toHaveBeenCalled();
      ws.serverAck();
      await flushPromises();

      expect(onStart).toHaveBeenCalledWith({ topic: "OnMessage" });
    });

    it("should start a listener joining a running subscription right away", async () => {
      await connect();
      const onStart = vi.fn();

      setup.onMessage.setPayload({ room: "a" }).listen(vi.fn());
      setup.onMessage.setPayload({ room: "a" }).listen(vi.fn(), { onStart });

      expect(onStart).toHaveBeenCalledTimes(1);
    });

    it("should report a subscription that could not be sent and send it after the next acknowledgement", async () => {
      vi.useFakeTimers();
      const ws = await connect();
      const onStart = vi.fn();
      const failure = new Error("Send failed");
      vi.spyOn(ws, "send").mockImplementationOnce(() => {
        throw failure;
      });

      setup.onMessage.setPayload({ room: "a" }).listen(vi.fn(), { onStart });

      expect(setup.errors).toStrictEqual([failure]);
      expect(onStart).not.toHaveBeenCalled();
      ws.serverClose({ code: 1006 });
      await vi.advanceTimersByTimeAsync(100);
      const next = await acknowledgeWebSocket(2);

      expect(next.subscriptions).toHaveLength(1);
      expect(onStart).toHaveBeenCalledTimes(1);
    });

    it("should report a document that can't be printed and still let the listener unsubscribe", async () => {
      const ws = await connect();
      const broken = setup.socket.createListener<unknown>()({
        topic: "Broken",
        options: { document: { kind: "Unknown" } as never },
      });

      const stop = broken.listen(vi.fn());

      expect(ws.subscriptions).toHaveLength(0);
      expect(setup.errors).toHaveLength(1);
      expect(setup.socket.adapter.listeners.get("Broken")?.size).toBe(1);
      stop();
      expect(setup.socket.adapter.listeners.get("Broken")?.size ?? 0).toBe(0);
    });

    it("should report variables that can't be serialized", async () => {
      const ws = await connect();
      const listener = setup.socket.createListener<unknown, { id: bigint }>()({ topic: "subscription { tick }" });

      listener.setPayload({ id: 1n }).listen(vi.fn());

      expect(ws.subscriptions).toHaveLength(0);
      expect(setup.errors[0]).toBeInstanceOf(TypeError);
    });
  });

  describe("when receiving events", () => {
    it("should deliver the data with the errors and extensions of the event", async () => {
      const ws = await connect();
      const callback = vi.fn<(event: Event<Message | null>) => void>();
      setup.onMessage.setPayload({ room: "a" }).listen(callback);

      ws.serverNext("1", {
        data: { onMessage: { text: "partial" } },
        errors: [{ message: "Author is unavailable", path: ["onMessage", "author"] }],
        extensions: { cost: 3 },
      });

      expect(callback).toHaveBeenCalledWith({
        data: { onMessage: { text: "partial" } },
        extra: {
          errors: [{ message: "Author is unavailable", path: ["onMessage", "author"] }],
          extensions: { cost: 3 },
          payload: { room: "a" },
        },
      });
      expect(setup.errors).toHaveLength(0);
    });

    it("should deliver null data for an event without data and keep the subscription", async () => {
      const ws = await connect();
      const callback = vi.fn<(event: Event<Message | null>) => void>();
      setup.onMessage.setPayload({ room: "a" }).listen(callback);

      ws.serverNext("1", { errors: [{ message: "Resolver failed" }] });
      ws.serverNext("1", { data: { onMessage: { text: "next" } } });

      expect(callback.mock.calls.map(([event]) => event.data)).toStrictEqual([null, { onMessage: { text: "next" } }]);
    });

    it("should ignore events of a subscription the client stopped", async () => {
      const ws = await connect();
      const callback = vi.fn();
      const stop = setup.onMessage.setPayload({ room: "a" }).listen(callback);

      stop();
      ws.serverNext("1", { data: { onMessage: { text: "late" } } });

      expect(callback).not.toHaveBeenCalled();
      expect(setup.errors).toHaveLength(0);
    });

    it("should ignore a late complete of a stopped subscription that was started again", async () => {
      const ws = await connect();
      const callback = vi.fn();
      setup.onMessage.setPayload({ room: "a" }).listen(vi.fn())();
      const stop = setup.onMessage.setPayload({ room: "a" }).listen(callback);

      // The server ends the first subscription while the client completes it
      ws.serverComplete("1");
      ws.serverNext("2", { data: { onMessage: { text: "second" } } });
      stop();

      expect(callback).toHaveBeenCalledTimes(1);
      expect(ws.completed).toStrictEqual(["1", "2"]);
    });

    it("should report a throwing callback and keep the subscription", async () => {
      const ws = await connect();
      const failure = new Error("Callback failed");
      const callback = vi.fn().mockImplementationOnce(() => {
        throw failure;
      });
      setup.onMessage.setPayload({ room: "a" }).listen(callback);

      ws.serverNext("1", { data: { onMessage: { text: "1" } } });
      ws.serverNext("1", { data: { onMessage: { text: "2" } } });

      expect(callback).toHaveBeenCalledTimes(2);
      expect(setup.errors).toStrictEqual([failure]);
    });
  });

  describe("when the server ends a subscription", () => {
    it("should end the listener on complete", async () => {
      const ws = await connect();
      const onEnd = vi.fn();
      const callback = vi.fn();
      setup.onMessage.setPayload({ room: "a" }).listen(callback, { onEnd });

      ws.serverComplete("1");
      ws.serverNext("1", { data: { onMessage: { text: "late" } } });

      expect(onEnd).toHaveBeenCalledWith({ topic: "OnMessage", error: null });
      expect(callback).not.toHaveBeenCalled();
      expect(ws.completed).toStrictEqual([]);
      expect(setup.socket.adapter.listeners.get("OnMessage")?.size ?? 0).toBe(0);
    });

    it("should end the listener with a GraphqlSubscriptionError on error", async () => {
      const ws = await connect();
      const onEnd = vi.fn();
      setup.onMessage.setPayload({ room: "a" }).listen(vi.fn(), { onEnd });

      ws.serverError("1", [{ message: "Unknown room", extensions: { code: "NOT_FOUND" } }]);

      const [{ error }] = onEnd.mock.calls[0];
      expect(error).toBeInstanceOf(GraphqlSubscriptionError);
      expect(error).toMatchObject({
        message: "Unknown room",
        errors: [{ message: "Unknown room", extensions: { code: "NOT_FOUND" } }],
        topic: "OnMessage",
        payload: { room: "a" },
      });
      expect(setup.errors).toStrictEqual([error]);
      expect(ws.completed).toStrictEqual([]);
    });

    it("should join the messages of every error", async () => {
      const ws = await connect();
      const onEnd = vi.fn();
      setup.onMessage.setPayload({ room: "a" }).listen(vi.fn(), { onEnd });

      ws.serverError("1", [{ message: "First" }, { message: "Second" }]);

      expect(onEnd.mock.calls[0][0].error.message).toBe("First\nSecond");
    });

    it("should start a new subscription for a later listener of an ended one", async () => {
      const ws = await connect();
      setup.onMessage.setPayload({ room: "a" }).listen(vi.fn());

      ws.serverComplete("1");
      setup.onMessage.setPayload({ room: "a" }).listen(vi.fn());

      expect(ws.subscriptions.map(({ id }) => id)).toStrictEqual(["1", "2"]);
    });

    it("should keep the other subscriptions running", async () => {
      const ws = await connect();
      const roomB = vi.fn();
      setup.onMessage.setPayload({ room: "a" }).listen(vi.fn());
      setup.onMessage.setPayload({ room: "b" }).listen(roomB);

      ws.serverError("1", [{ message: "Unknown room" }]);
      ws.serverNext("2", { data: { onMessage: { text: "still here" } } });

      expect(roomB).toHaveBeenCalledTimes(1);
    });
  });

  describe("when the connection drops", () => {
    it("should send every subscription again with new ids after the next acknowledgement", async () => {
      vi.useFakeTimers();
      const ws = await connect();
      const callback = vi.fn();
      setup.onMessage.setPayload({ room: "a" }).listen(callback);
      setup.onTick.listen(vi.fn());

      ws.serverClose({ code: 1006 });
      await vi.advanceTimersByTimeAsync(100);
      const next = await openWebSocket(2);
      expect(next.subscriptions).toHaveLength(0);
      next.serverAck();
      await flushPromises();

      expect(next.subscriptions.map(({ id, payload }) => [id, payload.operationName])).toStrictEqual([
        ["3", "OnMessage"],
        ["4", "OnTick"],
      ]);
      next.serverNext("3", { data: { onMessage: { text: "back" } } });
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should start the listeners again after the reconnect", async () => {
      vi.useFakeTimers();
      const ws = await connect();
      const onStart = vi.fn();
      setup.onMessage.setPayload({ room: "a" }).listen(vi.fn(), { onStart });

      ws.serverClose({ code: 1006 });
      await vi.advanceTimersByTimeAsync(100);
      await acknowledgeWebSocket(2);

      expect(onStart).toHaveBeenCalledTimes(2);
    });

    it("should not send a subscription stopped while disconnected", async () => {
      vi.useFakeTimers();
      const ws = await connect();
      const stop = setup.onMessage.setPayload({ room: "a" }).listen(vi.fn());

      ws.serverClose({ code: 1006 });
      stop();
      await vi.advanceTimersByTimeAsync(100);
      const next = await acknowledgeWebSocket(2);

      expect(next.subscriptions).toHaveLength(0);
      expect(next.completed).toHaveLength(0);
    });

    it("should ignore the messages of the previous connection", async () => {
      vi.useFakeTimers();
      const ws = await connect();
      const callback = vi.fn();
      setup.onMessage.setPayload({ room: "a" }).listen(callback);

      ws.serverClose({ code: 1006 });
      await vi.advanceTimersByTimeAsync(100);
      await acknowledgeWebSocket(2);
      ws.serverNext("1", { data: { onMessage: { text: "ghost" } } });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("when stopping a subscription", () => {
    it("should send complete for the subscription", async () => {
      const ws = await connect();
      const stop = setup.onMessage.setPayload({ room: "a" }).listen(vi.fn());

      stop();

      expect(ws.messages.at(-1)).toStrictEqual({ id: "1", type: "complete" });
    });

    it("should send nothing for a subscription that was not sent yet", async () => {
      setup.socket.connect();
      const ws = await openWebSocket();
      const stop = setup.onMessage.setPayload({ room: "a" }).listen(vi.fn());

      stop();
      ws.serverAck();
      await flushPromises();

      expect(ws.messages).toStrictEqual([{ type: "connection_init" }]);
    });

    it("should report a complete that could not be sent", async () => {
      const ws = await connect();
      const stop = setup.onMessage.setPayload({ room: "a" }).listen(vi.fn());
      const failure = new Error("Send failed");
      vi.spyOn(ws, "send").mockImplementation(() => {
        throw failure;
      });

      stop();

      expect(setup.errors).toStrictEqual([failure]);
    });
  });

  describe("when emitting", () => {
    it("should throw, queries and mutations are sent with the GraphqlAdapter", async () => {
      await connect();
      const emitter = setup.socket.createEmitter<{ id: string }>()({ topic: "anything" });

      expect(() => emitter.emit({ payload: { id: "1" } })).toThrow(
        "Cannot emit events with the GraphQL WebSocket adapter",
      );
    });
  });
});
